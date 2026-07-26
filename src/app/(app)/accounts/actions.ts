"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { AccountType } from "@/lib/types";

export type ActionResult = { error: string | null; ok?: boolean };

const VALID_TYPES: AccountType[] = [
  "checking",
  "savings",
  "credit_card",
  "cash",
  "investment",
  "loan",
  "other",
];

export async function createAccount(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "checking") as AccountType;
  const currency = String(formData.get("currency") ?? "USD").trim() || "USD";
  const startingBalance = Number(formData.get("starting_balance") ?? 0);

  if (!name) return { error: "Please give the account a name." };
  if (!VALID_TYPES.includes(type)) return { error: "Invalid account type." };
  if (Number.isNaN(startingBalance))
    return { error: "Starting balance must be a number." };

  const { error } = await supabase.from("accounts").insert({
    user_id: user.id,
    name,
    type,
    currency,
    starting_balance: startingBalance,
  });

  if (error) return { error: error.message };

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return { error: null, ok: true };
}

export async function updateAccount(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "checking") as AccountType;
  const currency = String(formData.get("currency") ?? "USD").trim() || "USD";
  const startingBalance = Number(formData.get("starting_balance") ?? 0);

  if (!id) return { error: "Missing account id." };
  if (!name) return { error: "Please give the account a name." };

  const { error } = await supabase
    .from("accounts")
    .update({ name, type, currency, starting_balance: startingBalance })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return { error: null, ok: true };
}

export async function deleteAccount(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("accounts").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}
