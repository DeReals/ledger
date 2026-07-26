"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { Frequency, TransactionType, RecurringTransaction } from "@/lib/types";

export type ActionResult = { error: string | null; ok?: boolean };

/** Advance a "YYYY-MM-DD" date by one period of the given frequency. */
function advance(dateStr: string, freq: Frequency): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (freq === "daily") date.setDate(date.getDate() + 1);
  else if (freq === "weekly") date.setDate(date.getDate() + 7);
  else if (freq === "monthly") date.setMonth(date.getMonth() + 1);
  else if (freq === "yearly") date.setFullYear(date.getFullYear() + 1);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export async function createRecurring(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const type = String(formData.get("type") ?? "expense") as TransactionType;
  const account_id = String(formData.get("account_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const frequency = String(formData.get("frequency") ?? "monthly") as Frequency;
  const next_date = String(formData.get("next_date") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;
  const category_id = String(formData.get("category_id") ?? "") || null;

  if (!account_id) return { error: "Please choose an account." };
  if (!next_date) return { error: "Please choose the next date." };
  if (Number.isNaN(amount) || amount <= 0)
    return { error: "Amount must be greater than zero." };
  if (type === "transfer")
    return { error: "Transfers aren't supported for recurring items yet." };

  const { error } = await supabase.from("recurring_transactions").insert({
    user_id: user.id,
    account_id,
    category_id,
    type,
    amount,
    frequency,
    next_date,
    description,
  });

  if (error) return { error: error.message };
  revalidatePath("/recurring");
  return { error: null, ok: true };
}

export async function deleteRecurring(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/recurring");
}

/**
 * Post every recurring item that's due (next_date on or before today).
 * For each, create a real transaction and roll next_date forward — it
 * catches up if several periods were missed.
 */
export async function postDue(): Promise<void> {
  const { supabase, user } = await requireUser();

  // Compute today as YYYY-MM-DD in server local time.
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const { data: due } = await supabase
    .from("recurring_transactions")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .lte("next_date", today);

  for (const r of ((due as RecurringTransaction[]) ?? [])) {
    let nextDate = r.next_date;
    const toInsert: {
      user_id: string;
      account_id: string;
      category_id: string | null;
      type: string;
      amount: number;
      description: string | null;
      date: string;
    }[] = [];

    // Catch up any missed periods (cap at 60 to avoid runaways).
    let guard = 0;
    while (nextDate <= today && guard < 60) {
      toInsert.push({
        user_id: user.id,
        account_id: r.account_id,
        category_id: r.category_id,
        type: r.type,
        amount: Number(r.amount),
        description: r.description,
        date: nextDate,
      });
      nextDate = advance(nextDate, r.frequency);
      guard++;
    }

    if (toInsert.length > 0) {
      await supabase.from("transactions").insert(toInsert);
      await supabase
        .from("recurring_transactions")
        .update({ next_date: nextDate })
        .eq("id", r.id)
        .eq("user_id", user.id);
    }
  }

  revalidatePath("/recurring");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
}
