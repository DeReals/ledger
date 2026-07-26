"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { CategoryKind } from "@/lib/types";

export type ActionResult = { error: string | null; ok?: boolean };

const VALID_KINDS: CategoryKind[] = ["income", "expense"];

function revalidate() {
  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/reports");
}

export async function createCategory(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "expense") as CategoryKind;
  const color = String(formData.get("color") ?? "#6366f1").trim() || "#6366f1";

  if (!name) return { error: "Please give the category a name." };
  if (!VALID_KINDS.includes(kind)) return { error: "Invalid category type." };

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name,
    kind,
    color,
  });

  if (error) return { error: error.message };
  revalidate();
  return { error: null, ok: true };
}

export async function updateCategory(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "expense") as CategoryKind;
  const color = String(formData.get("color") ?? "#6366f1").trim() || "#6366f1";

  if (!id) return { error: "Missing category id." };
  if (!name) return { error: "Please give the category a name." };
  if (!VALID_KINDS.includes(kind)) return { error: "Invalid category type." };

  const { error } = await supabase
    .from("categories")
    .update({ name, kind, color })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidate();
  return { error: null, ok: true };
}

export async function deleteCategory(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Transactions keep their history but become "Uncategorized"
  // (the database sets their category to null automatically).
  await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidate();
}
