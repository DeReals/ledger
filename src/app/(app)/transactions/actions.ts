"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { TransactionType } from "@/lib/types";

export type ActionResult = { error: string | null; ok?: boolean };

const VALID_TYPES: TransactionType[] = ["income", "expense", "transfer"];

function parseForm(formData: FormData) {
  const type = String(formData.get("type") ?? "expense") as TransactionType;
  const account_id = String(formData.get("account_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const date = String(formData.get("date") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;
  const rawCategory = String(formData.get("category_id") ?? "");
  const rawTransfer = String(formData.get("transfer_account_id") ?? "");

  return {
    type,
    account_id,
    amount,
    date,
    description,
    category_id: rawCategory || null,
    transfer_account_id: rawTransfer || null,
  };
}

function validate(f: ReturnType<typeof parseForm>): string | null {
  if (!VALID_TYPES.includes(f.type)) return "Invalid transaction type.";
  if (!f.account_id) return "Please choose an account.";
  if (!f.date) return "Please choose a date.";
  if (Number.isNaN(f.amount) || f.amount <= 0)
    return "Amount must be greater than zero.";
  if (f.type === "transfer") {
    if (!f.transfer_account_id)
      return "Please choose the account to transfer to.";
    if (f.transfer_account_id === f.account_id)
      return "Transfer accounts must be different.";
  }
  return null;
}

export async function createTransaction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const f = parseForm(formData);
  const err = validate(f);
  if (err) return { error: err };

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    account_id: f.account_id,
    type: f.type,
    amount: f.amount,
    date: f.date,
    description: f.description,
    // categories only apply to income/expense, not transfers
    category_id: f.type === "transfer" ? null : f.category_id,
    transfer_account_id: f.type === "transfer" ? f.transfer_account_id : null,
  });

  if (error) return { error: error.message };

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/budgets");
  return { error: null, ok: true };
}

export async function updateTransaction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing transaction id." };

  const f = parseForm(formData);
  const err = validate(f);
  if (err) return { error: err };

  const { error } = await supabase
    .from("transactions")
    .update({
      account_id: f.account_id,
      type: f.type,
      amount: f.amount,
      date: f.date,
      description: f.description,
      category_id: f.type === "transfer" ? null : f.category_id,
      transfer_account_id: f.type === "transfer" ? f.transfer_account_id : null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/budgets");
  return { error: null, ok: true };
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/budgets");
}
