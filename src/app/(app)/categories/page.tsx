import { requireUser } from "@/lib/auth";
import { CategoriesClient } from "@/components/CategoriesClient";
import type { Category } from "@/lib/types";

export default async function CategoriesPage() {
  const { supabase } = await requireUser();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  return <CategoriesClient categories={(categories as Category[]) ?? []} />;
}
