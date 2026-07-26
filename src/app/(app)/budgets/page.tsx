import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { setBudget } from "./actions";
import { Card, EmptyState, PageHeader, inputClass } from "@/components/ui";
import {
  formatMoney,
  todayISO,
  monthStart,
  addMonths,
  formatMonthLabel,
} from "@/lib/format";
import type { Budget, Category, Transaction } from "@/lib/types";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { supabase } = await requireUser();
  const params = await searchParams;

  const month = params.month ?? monthStart(todayISO());
  const nextMonth = addMonths(month, 1);

  const [{ data: categories }, { data: budgets }, { data: monthTx }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("kind", "expense")
        .order("name"),
      supabase.from("budgets").select("*").eq("month", month),
      supabase
        .from("transactions")
        .select("*")
        .eq("type", "expense")
        .gte("date", month)
        .lt("date", nextMonth),
    ]);

  const budgetByCat = new Map(
    ((budgets as Budget[]) ?? []).map((b) => [b.category_id, Number(b.amount)]),
  );
  const spentByCat = new Map<string, number>();
  for (const t of (monthTx as Transaction[]) ?? []) {
    if (!t.category_id) continue;
    spentByCat.set(
      t.category_id,
      (spentByCat.get(t.category_id) ?? 0) + Number(t.amount),
    );
  }

  const cats = (categories as Category[]) ?? [];
  const totalBudget = cats.reduce(
    (s, c) => s + (budgetByCat.get(c.id) ?? 0),
    0,
  );
  const totalSpent = cats.reduce((s, c) => s + (spentByCat.get(c.id) ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Budgets"
        subtitle="Set a monthly limit per category and track your spending."
      />

      {/* Month navigation */}
      <div className="mb-6 flex items-center justify-center gap-4">
        <Link
          href={`/budgets?month=${addMonths(month, -1)}`}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700"
        >
          ← Prev
        </Link>
        <span className="min-w-40 text-center font-semibold text-slate-900 dark:text-white">
          {formatMonthLabel(month)}
        </span>
        <Link
          href={`/budgets?month=${nextMonth}`}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700"
        >
          Next →
        </Link>
      </div>

      {cats.length === 0 ? (
        <EmptyState
          title="No expense categories"
          hint="Categories are created automatically when you sign up. Add transactions to start using them."
        />
      ) : (
        <>
          <Card className="mb-4 flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-200">
              Total budgeted: {formatMoney(totalBudget)}
            </span>
            <span
              className={`font-medium ${
                totalSpent > totalBudget && totalBudget > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-700 dark:text-slate-200"
              }`}
            >
              Spent: {formatMoney(totalSpent)}
            </span>
          </Card>

          <div className="space-y-3">
            {cats.map((c) => {
              const budget = budgetByCat.get(c.id) ?? 0;
              const spent = spentByCat.get(c.id) ?? 0;
              const pct =
                budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
              const over = budget > 0 && spent > budget;

              return (
                <Card key={c.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="font-medium text-slate-900 dark:text-white">
                        {c.name}
                      </span>
                    </div>

                    <form
                      action={setBudget}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="category_id" value={c.id} />
                      <input type="hidden" name="month" value={month} />
                      <span className="text-sm text-slate-400">Budget</span>
                      <input
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={budget || ""}
                        placeholder="0.00"
                        className={`${inputClass} w-28`}
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        Save
                      </button>
                    </form>
                  </div>

                  {budget > 0 && (
                    <div className="mt-3">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full ${
                            over ? "bg-red-500" : "bg-indigo-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p
                        className={`mt-1 text-sm ${
                          over
                            ? "text-red-600 dark:text-red-400"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {formatMoney(spent)} of {formatMoney(budget)}
                        {over
                          ? ` · over by ${formatMoney(spent - budget)}`
                          : ` · ${formatMoney(budget - spent)} left`}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
