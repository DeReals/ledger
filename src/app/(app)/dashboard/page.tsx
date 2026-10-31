import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { DashboardProgressChart } from "@/components/DashboardProgressChart";
import { DebtPayoffProjection } from "@/components/DebtPayoffProjection";
import {
  formatMoney,
  formatDate,
  todayISO,
  monthStart,
  addMonths,
  formatMonthLabel,
} from "@/lib/format";
import type {
  Account,
  Budget,
  Category,
  Goal,
  Transaction,
} from "@/lib/types";

const DEBT_ACCOUNT_TYPES = new Set(["credit_card", "loan"]);

export default async function DashboardPage() {
  const { supabase } = await requireUser();
  const today = todayISO();
  const firstOfMonth = monthStart(today);
  const firstOfNextMonth = addMonths(firstOfMonth, 1);
  const firstOfSixMonths = addMonths(firstOfMonth, -5);

  const [
    { data: balances },
    { data: accounts },
    { data: sixMonthTransactions },
    { data: recentTransactions },
    { data: categories },
    { data: budgets },
    { data: goals },
  ] = await Promise.all([
    supabase
      .from("account_balances")
      .select("account_id, name, balance, currency"),
    supabase.from("accounts").select("*").order("name"),
    supabase
      .from("transactions")
      .select("*")
      .gte("date", firstOfSixMonths)
      .lt("date", firstOfNextMonth),
    supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("categories").select("*"),
    supabase.from("budgets").select("category_id, amount").eq("month", firstOfMonth),
    supabase.from("goals").select("target_amount, current_amount"),
  ]);

  const accountRows = (accounts as Account[]) ?? [];
  const accountById = new Map(accountRows.map((account) => [account.id, account]));
  const balanceRows = balances ?? [];
  const currency = accountRows[0]?.currency ?? "USD";
  const transactions = (sixMonthTransactions as Transaction[]) ?? [];
  const currentMonthTransactions = transactions.filter(
    (transaction) => transaction.date >= firstOfMonth,
  );
  const expenses = currentMonthTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const income = currentMonthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const monthlyMargin = income - expenses;
  const totalBudget = ((budgets as Budget[]) ?? []).reduce(
    (sum, budget) => sum + Number(budget.amount),
    0,
  );
  const budgetLeft = totalBudget - expenses;
  const dayOfMonth = Number(today.slice(8, 10));
  const daysInMonth = new Date(
    Number(today.slice(0, 4)),
    Number(today.slice(5, 7)),
    0,
  ).getDate();
  const daysLeft = Math.max(1, daysInMonth - dayOfMonth + 1);
  const suggestedDailyPayment =
    monthlyMargin > 0 ? monthlyMargin / dayOfMonth : 0;
  const dailyLimit = budgetLeft > 0 ? budgetLeft / daysLeft : 0;
  const debt = balanceRows.reduce((sum, balance) => {
    const account = accountById.get(balance.account_id);
    return account && DEBT_ACCOUNT_TYPES.has(account.type)
      ? sum + Math.abs(Number(balance.balance))
      : sum;
  }, 0);
  const assets = balanceRows.reduce((sum, balance) => {
    const account = accountById.get(balance.account_id);
    return account && !DEBT_ACCOUNT_TYPES.has(account.type)
      ? sum + Number(balance.balance)
      : sum;
  }, 0);
  const netWorth = assets - debt;
  const goalRows = (goals as Pick<Goal, "target_amount" | "current_amount">[]) ?? [];
  const goalsTarget = goalRows.reduce(
    (sum, goal) => sum + Number(goal.target_amount),
    0,
  );
  const goalsSaved = goalRows.reduce(
    (sum, goal) => sum + Number(goal.current_amount),
    0,
  );
  const goalProgress =
    goalsTarget > 0 ? Math.min(100, (goalsSaved / goalsTarget) * 100) : 0;
  const categoryName = new Map(
    ((categories as Category[]) ?? []).map((category) => [
      category.id,
      category.name,
    ]),
  );
  const monthlyProgress = Array.from({ length: 6 }, (_, index) => {
    const month = addMonths(firstOfSixMonths, index);
    const nextMonth = addMonths(month, 1);
    const monthTransactions = transactions.filter(
      (transaction) => transaction.date >= month && transaction.date < nextMonth,
    );
    return {
      month: formatMonthLabel(month).replace(/ \d{4}$/, ""),
      Income: monthTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
      Spending: monthTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
    };
  });
  const hasData = accountRows.length > 0;

  return (
    <div>
      <PageHeader
        title="Your money, with intention"
        subtitle={`${formatMonthLabel(firstOfMonth)} · Spend less than you earn, save first, and make a plan for every dollar.`}
        action={
          <Link
            href="/transactions"
            className="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
          >
            + Add transaction
          </Link>
        }
      />

      {!hasData ? (
        <EmptyState
          title="Start with a clear picture"
          hint="Add your checking and savings accounts, then set a monthly spending plan and savings goal."
        />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Income this month
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {formatMoney(income, currency)}
              </p>
              <p className="mt-1 text-xs text-stone-400">Money received</p>
            </Card>
            <Card>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Spent this month
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-stone-900 dark:text-white">
                {formatMoney(expenses, currency)}
              </p>
              <p className="mt-1 text-xs text-stone-400">
                {totalBudget > 0
                  ? `${formatMoney(Math.max(0, budgetLeft), currency)} of your plan left`
                  : "Set a budget to give spending a limit"}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Left after spending
              </p>
              <p
                className={`mt-1 text-2xl font-bold tabular-nums ${
                  monthlyMargin < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-700 dark:text-emerald-400"
                }`}
              >
                {formatMoney(monthlyMargin, currency)}
              </p>
              <p className="mt-1 text-xs text-stone-400">
                {monthlyMargin < 0
                  ? "Spending is ahead of income"
                  : "Protect this margin for savings or debt"}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Debt to clear
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-stone-900 dark:text-white">
                {formatMoney(debt, currency)}
              </p>
              <p className="mt-1 text-xs text-stone-400">
                Net worth: {formatMoney(netWorth, currency)}
              </p>
            </Card>
          </div>

          <div className="mb-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-stone-900 dark:text-white">
                    Your spending guardrail
                  </h2>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    A plan makes it easier to stop overspending before it starts.
                  </p>
                </div>
                <Link
                  href="/budgets"
                  className="text-sm font-medium text-orange-700 hover:underline dark:text-orange-400"
                >
                  {totalBudget > 0 ? "Adjust plan" : "Set a plan"} →
                </Link>
              </div>
              {totalBudget > 0 ? (
                <>
                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-3xl font-bold tabular-nums text-stone-900 dark:text-white">
                        {formatMoney(Math.max(0, budgetLeft), currency)}
                      </p>
                      <p className="text-sm text-stone-500 dark:text-stone-400">
                        left of {formatMoney(totalBudget, currency)} planned
                      </p>
                    </div>
                    <p className="text-right text-sm text-stone-500 dark:text-stone-400">
                      {budgetLeft > 0
                        ? `${formatMoney(dailyLimit, currency)} / day`
                        : budgetLeft < 0
                          ? `${formatMoney(Math.abs(budgetLeft), currency)} over plan`
                          : "Plan fully used"}
                    </p>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                    <div
                      className={`h-full rounded-full ${
                        budgetLeft < 0 ? "bg-rose-500" : "bg-orange-500"
                      }`}
                      style={{
                        width: `${Math.min(100, (expenses / totalBudget) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                    {formatMoney(expenses, currency)} spent · {daysLeft}{" "}
                    {daysLeft === 1 ? "day" : "days"} left in the month
                  </p>
                </>
              ) : (
                <div className="mt-5 rounded-2xl bg-orange-50 p-4 dark:bg-orange-950/30">
                  <p className="font-medium text-stone-900 dark:text-white">
                    Give your money a job before you spend it.
                  </p>
                  <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                    Set limits for essentials and flexible spending, then check
                    in here to stay within them.
                  </p>
                </div>
              )}
            </Card>

            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-stone-900 dark:text-white">
                    Save first
                  </h2>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    Build a cushion one contribution at a time.
                  </p>
                </div>
                <Link
                  href="/goals"
                  className="text-sm font-medium text-orange-700 hover:underline dark:text-orange-400"
                >
                  {goalRows.length > 0 ? "View goals" : "Start saving"} →
                </Link>
              </div>
              {goalRows.length > 0 ? (
                <>
                  <div className="mt-5 flex items-end justify-between gap-3">
                    <p className="text-3xl font-bold tabular-nums text-stone-900 dark:text-white">
                      {formatMoney(goalsSaved, currency)}
                    </p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      of {formatMoney(goalsTarget, currency)}
                    </p>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${goalProgress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                    {goalProgress.toFixed(0)}% of your savings goals
                  </p>
                </>
              ) : (
                <div className="mt-5 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                  <p className="font-medium text-stone-900 dark:text-white">
                    Make saving automatic in your plan.
                  </p>
                  <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                    Start with an emergency-fund goal and add contributions as
                    you pay yourself first.
                  </p>
                </div>
              )}
            </Card>
          </div>

          {monthlyMargin < 0 && (
            <Card className="mb-6 border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30">
              <p className="font-semibold text-rose-800 dark:text-rose-300">
                This month, spending is {formatMoney(Math.abs(monthlyMargin), currency)}{" "}
                more than income.
              </p>
              <p className="mt-1 text-sm text-rose-700 dark:text-rose-400">
                Review flexible categories, pause non-essential purchases, and
                adjust your plan so next month starts with a surplus.
              </p>
            </Card>
          )}

          <DashboardProgressChart monthly={monthlyProgress} currency={currency} />

          <div className="mb-6">
            <DebtPayoffProjection
              debt={debt}
              currency={currency}
              suggestedDailyPayment={suggestedDailyPayment}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-stone-900 dark:text-white">
                    Account balances
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Debt accounts are counted as money owed.
                  </p>
                </div>
                <Link
                  href="/accounts"
                  className="text-sm text-orange-700 hover:underline dark:text-orange-400"
                >
                  Manage
                </Link>
              </div>
              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {balanceRows.map((balance) => {
                  const isDebt = DEBT_ACCOUNT_TYPES.has(
                    accountById.get(balance.account_id)?.type ?? "",
                  );
                  const amount = Number(balance.balance);
                  return (
                    <li
                      key={balance.account_id}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <span className="text-stone-700 dark:text-stone-200">
                        {balance.name}
                        {isDebt && (
                          <span className="ml-2 text-xs text-stone-400">
                            debt
                          </span>
                        )}
                      </span>
                      <span
                        className={`font-medium tabular-nums ${
                          isDebt || amount < 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-stone-900 dark:text-white"
                        }`}
                      >
                        {isDebt ? "−" : ""}
                        {formatMoney(Math.abs(amount), balance.currency)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-stone-900 dark:text-white">
                  Recent activity
                </h2>
                <Link
                  href="/transactions"
                  className="text-sm text-orange-700 hover:underline dark:text-orange-400"
                >
                  View all
                </Link>
              </div>
              {((recentTransactions as Transaction[]) ?? []).length === 0 ? (
                <p className="py-4 text-sm text-stone-500 dark:text-stone-400">
                  No transactions yet. Logging spending regularly makes your
                  plan useful.
                </p>
              ) : (
                <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                  {((recentTransactions as Transaction[]) ?? []).map(
                    (transaction) => (
                      <li
                        key={transaction.id}
                        className="flex items-center justify-between gap-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-stone-700 dark:text-stone-200">
                            {transaction.description ||
                              (transaction.type === "transfer"
                                ? "Transfer"
                                : transaction.category_id
                                  ? categoryName.get(transaction.category_id)
                                  : "Uncategorized")}
                          </p>
                          <p className="truncate text-xs text-stone-400">
                            {formatDate(transaction.date)} ·{" "}
                            {accountById.get(transaction.account_id)?.name}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 font-medium tabular-nums ${
                            transaction.type === "income"
                              ? "text-emerald-700 dark:text-emerald-400"
                              : transaction.type === "expense"
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-stone-600 dark:text-stone-300"
                          }`}
                        >
                          {transaction.type === "income"
                            ? "+"
                            : transaction.type === "expense"
                              ? "−"
                              : ""}
                          {formatMoney(Number(transaction.amount), currency)}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
