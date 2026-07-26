"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

export async function setBudget(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();

  const category_id = String(formData.get("category_id") ?? "");
  const month = String(formData.get("month") ?? "");
  const amount = Number(formData.get("amount") ?? 0);

  if (!category_id || !month) return;

  if (Number.isNaN(amount) || amount <= 0) {
    // A zero/blank amount means "remove this budget".
    await supabase
      .from("budgets")
      .delete()
      .eq("user_id", user.id)
      .eq("category_id", category_id)
      .eq("month", month);
  } else {
    // Insert or update the budget for this category + month.
    await supabase.from("budgets").upsert(
      {
        user_id: user.id,
        category_id,
        month,
        amount,
      },
      { onConflict: "user_id,category_id,month" },
    );
  }

  revalidatePath("/budgets");
}
