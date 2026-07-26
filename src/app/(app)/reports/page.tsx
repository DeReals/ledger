import { requireUser } from "@/lib/auth";
import { ReportsClient } from "@/components/ReportsClient";
import { PageHeader, EmptyState } from "@/components/ui";
import {
  todayISO,
  monthStart,
  addMonths,
  formatMonthLabel,
} from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";

export default async function ReportsPage() {
  const { supabase } = await requireUser();

  const currentMonth = monthStart(todayISO());
  const sixMonthsAgo = addMonths(currentMonth, -5);
  const nextMonth = addMonths(currentMonth, 1);

  const [{ data: tx }, { data: categories }] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .gte("date", sixMonthsAgo)
      .lt("date", nextMonth),
    supabase.from("categories").select("*"),
  ]);

  const transactions = (tx as Transaction[]) ?? [];
  const cats = (categories as Category[]) ?? [];

  // --- Monthly income vs expense (last 6 months) ---
  const months: string[] = [];
  for (let i = 0; i < 6; i++) months.push(addMonths(sixMonthsAgo, i));

  const monthly = months.map((m) => {
    const next = addMonths(m, 1);
    const inMonth = transactions.filter((t) => t.date >= m && t.date < next);
    return {
      month: formatMonthLabel(m).replace(/ \d{4}$/, ""), // e.g. "July"
      Income: inMonth
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + Number(t.amount), 0),
      Expenses: inMonth
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + Number(t.amount), 0),
    };
  });

  // --- Spending by category (current month) ---
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const catColor = new Map(cats.map((c) => [c.id, c.color]));
  const spendMap = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense" || t.date < currentMonth) continue;
    const key = t.category_id ?? "uncategorized";
    spendMap.set(key, (spendMap.get(key) ?? 0) + Number(t.amount));
  }
  const byCategory = Array.from(spendMap.entries())
    .map(([id, value]) => ({
      name: id === "uncategorized" ? "Uncategorized" : (catName.get(id) ?? "—"),
      value,
      color: catColor.get(id) ?? "#94a3b8",
    }))
    .sort((a, b) => b.value - a.value);

  const hasData = transactions.length > 0;

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="See where your money comes from and where it goes."
      />
      {!hasData ? (
        <EmptyState
          title="No data to chart yet"
          hint="Add some transactions and your reports will appear here."
        />
      ) : (
        <ReportsClient
          monthly={monthly}
          byCategory={byCategory}
          currentMonthLabel={formatMonthLabel(currentMonth)}
        />
      )}
    </div>
  );
}
