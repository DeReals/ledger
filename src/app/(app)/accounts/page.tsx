import { requireUser } from "@/lib/auth";
import { AccountsClient } from "@/components/AccountsClient";
import type { Account } from "@/lib/types";

export default async function AccountsPage() {
  const { supabase } = await requireUser();

  const [{ data: accounts }, { data: balances }] = await Promise.all([
    supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase.from("account_balances").select("account_id, balance"),
  ]);

  const balanceMap = new Map(
    (balances ?? []).map((b) => [b.account_id, Number(b.balance)]),
  );

  const rows = ((accounts as Account[]) ?? []).map((a) => ({
    ...a,
    balance: balanceMap.get(a.id) ?? Number(a.starting_balance),
  }));

  return <AccountsClient accounts={rows} />;
}
