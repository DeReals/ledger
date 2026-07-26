import { requireUser } from "@/lib/auth";
import { TransactionsClient } from "@/components/TransactionsClient";
import type { Account, Category, Transaction } from "@/lib/types";

export default async function TransactionsPage() {
  const { supabase } = await requireUser();

  const [{ data: transactions }, { data: accounts }, { data: categories }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("accounts").select("*").order("name"),
      supabase.from("categories").select("*").order("name"),
    ]);

  return (
    <TransactionsClient
      transactions={(transactions as Transaction[]) ?? []}
      accounts={(accounts as Account[]) ?? []}
      categories={(categories as Category[]) ?? []}
    />
  );
}
