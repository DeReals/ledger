import { requireUser } from "@/lib/auth";
import { RecurringClient } from "@/components/RecurringClient";
import type { Account, Category, RecurringTransaction } from "@/lib/types";

export default async function RecurringPage() {
  const { supabase } = await requireUser();

  const [{ data: recurring }, { data: accounts }, { data: categories }] =
    await Promise.all([
      supabase
        .from("recurring_transactions")
        .select("*")
        .order("next_date", { ascending: true }),
      supabase.from("accounts").select("*").order("name"),
      supabase.from("categories").select("*").order("name"),
    ]);

  return (
    <RecurringClient
      recurring={(recurring as RecurringTransaction[]) ?? []}
      accounts={(accounts as Account[]) ?? []}
      categories={(categories as Category[]) ?? []}
    />
  );
}
