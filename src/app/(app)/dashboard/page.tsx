import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { formatMoney, formatDate, todayISO, monthStart } from "@/lib/format";
import type { Account, Category, Transaction } from "@/lib/types";

export default async function DashboardPage() {
  const { supabase } = await requireUser();

  const firstOfMonth = monthStart(todayISO());

  const [
    { data: balances },
    { data: accounts },
    { data: monthTx },
    { data: recent },
    { data: categories },
  ] = await Promise.all([
    supabase.from("account_balances").select("account_id, name, balance, currency"),
    supabase.from("accounts").select("*").order("name"),
    supabase.from("transactions").select("*").gte("date", firstOfMonth),
    supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("categories").select("*"),
  ]);

  const currency = (accounts as Account[])?.[0]?.currency ?? "USD";

  const netWorth = (balances ?? []).reduce(
    (sum, b) => sum + Number(b.balance),
    0,
  );

  const monthIncome = ((monthTx as Transaction[]) ?? [])
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const monthExpense = ((monthTx as Transaction[]) ?? [])
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const monthNet = monthIncome - monthExpense;

  const accountName = new Map(
    ((accounts as Account[]) ?? []).map((a) => [a.id, a.name]),
  );
  const categoryName = new Map(
    ((categories as Category[]) ?? []).map((c) => [c.id, c.name]),
  );

  const hasData = (accounts as Account[])?.length > 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="A snapshot of your finances this month."
      />

      {!hasData ? (
        <EmptyState
          title="Welcome to your ledger! 👋"
          hint="Start by adding your accounts, then log some transactions."
        />
      ) : (
        <>
          {/* Summary cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Net worth
              </p>
              <p
                className={`mt-1 text-2xl font-bold tabular-nums ${
                  netWorth < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-stone-900 dark:text-white"
                }`}
              >
                {formatMoney(netWorth, currency)}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Income this month
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatMoney(monthIncome, currency)}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Spent this month
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
                {formatMoney(monthExpense, currency)}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Net this month
              </p>
              <p
                className={`mt-1 text-2xl font-bold tabular-nums ${
                  monthNet < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {monthNet >= 0 ? "+" : ""}
                {formatMoney(monthNet, currency)}
              </p>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Account balances */}
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-stone-900 dark:text-white">
                  Accounts
                </h2>
                <Link
                  href="/accounts"
                  className="text-sm text-orange-600 hover:underline"
                >
                  Manage
                </Link>
              </div>
              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {(balances ?? []).map((b) => (
                  <li
                    key={b.account_id}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-stone-700 dark:text-stone-200">
                      {b.name}
                    </span>
                    <span
                      className={`font-medium tabular-nums ${
                        Number(b.balance) < 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-stone-900 dark:text-white"
                      }`}
                    >
                      {formatMoney(Number(b.balance), b.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Recent transactions */}
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-stone-900 dark:text-white">
                  Recent activity
                </h2>
                <Link
                  href="/transactions"
                  className="text-sm text-orange-600 hover:underline"
                >
                  View all
                </Link>
              </div>
              {((recent as Transaction[]) ?? []).length === 0 ? (
                <p className="py-4 text-sm text-stone-500 dark:text-stone-400">
                  No transactions yet.
                </p>
              ) : (
                <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                  {((recent as Transaction[]) ?? []).map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-stone-700 dark:text-stone-200">
                          {t.description ||
                            (t.type === "transfer"
                              ? "Transfer"
                              : t.category_id
                                ? categoryName.get(t.category_id)
                                : "Uncategorized")}
                        </p>
                        <p className="truncate text-xs text-stone-400">
                          {formatDate(t.date)} · {accountName.get(t.account_id)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 font-medium tabular-nums ${
                          t.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : t.type === "expense"
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-stone-600 dark:text-stone-300"
                        }`}
                      >
                        {t.type === "income"
                          ? "+"
                          : t.type === "expense"
                            ? "−"
                            : ""}
                        {formatMoney(Number(t.amount), currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
