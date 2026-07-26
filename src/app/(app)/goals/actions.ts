"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

export type ActionResult = { error: string | null; ok?: boolean };

export async function createGoal(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const target = Number(formData.get("target_amount") ?? 0);
  const current = Number(formData.get("current_amount") ?? 0);
  const targetDate = String(formData.get("target_date") ?? "").trim() || null;

  if (!name) return { error: "Please name your goal." };
  if (Number.isNaN(target) || target <= 0)
    return { error: "Target amount must be greater than zero." };

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    name,
    target_amount: target,
    current_amount: Number.isNaN(current) ? 0 : current,
    target_date: targetDate,
  });

  if (error) return { error: error.message };
  revalidatePath("/goals");
  return { error: null, ok: true };
}

/** Add (or subtract) money toward a goal. */
export async function contribute(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const delta = Number(formData.get("delta") ?? 0);
  if (!id || Number.isNaN(delta) || delta === 0) return;

  const { data: goal } = await supabase
    .from("goals")
    .select("current_amount")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!goal) return;

  const next = Math.max(0, Number(goal.current_amount) + delta);
  await supabase
    .from("goals")
    .update({ current_amount: next })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/goals");
}

export async function deleteGoal(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase.from("goals").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/goals");
}
