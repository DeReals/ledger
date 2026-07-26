"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/format";

type MonthlyPoint = { month: string; Income: number; Expenses: number };
type CategoryPoint = { name: string; value: number; color: string };

export function ReportsClient({
  monthly,
  byCategory,
  currentMonthLabel,
}: {
  monthly: MonthlyPoint[];
  byCategory: CategoryPoint[];
  currentMonthLabel: string;
}) {
  const totalSpent = byCategory.reduce((s, c) => s + c.value, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">
          Income vs. Expenses (6 months)
        </h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} width={40} />
              <Tooltip
                formatter={(value) => formatMoney(Number(value))}
                contentStyle={{ borderRadius: 8, fontSize: 13 }}
              />
              <Legend />
              <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">
          Spending by category · {currentMonthLabel}
        </h2>
        {byCategory.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
            No spending recorded this month.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-56 w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                  >
                    {byCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatMoney(Number(value))}
                    contentStyle={{ borderRadius: 8, fontSize: 13 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-full space-y-1 sm:w-1/2">
              {byCategory.map((c) => (
                <li
                  key={c.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.name}
                  </span>
                  <span className="tabular-nums text-slate-900 dark:text-white">
                    {formatMoney(c.value)}
                    <span className="ml-1 text-xs text-slate-400">
                      {totalSpent > 0
                        ? `${((c.value / totalSpent) * 100).toFixed(0)}%`
                        : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
