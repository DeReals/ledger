"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/format";

type MonthlyProgress = {
  month: string;
  Income: number;
  Spending: number;
};

export function DashboardProgressChart({
  monthly,
  currency,
}: {
  monthly: MonthlyProgress[];
  currency: string;
}) {
  const hasActivity = monthly.some(
    (month) => month.Income > 0 || month.Spending > 0,
  );

  return (
    <Card className="mb-6">
      <div className="mb-4">
        <h2 className="font-semibold text-stone-900 dark:text-white">
          Your progress over time
        </h2>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Compare income with spending each month. Aim to keep spending below
          income.
        </p>
      </div>
      {!hasActivity ? (
        <p className="py-12 text-center text-sm text-stone-500 dark:text-stone-400">
          Add income and expense transactions to see your progress here.
        </p>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 8, right: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis
                fontSize={12}
                width={64}
                tickFormatter={(value: number) =>
                  new Intl.NumberFormat("en-US", {
                    notation: "compact",
                    style: "currency",
                    currency,
                    maximumFractionDigits: 1,
                  }).format(value)
                }
              />
              <Tooltip
                formatter={(value) => formatMoney(Number(value), currency)}
                contentStyle={{ borderRadius: 12, fontSize: 13 }}
              />
              <Legend />
              <Bar dataKey="Income" fill="#16a34a" radius={[5, 5, 0, 0]} />
              <Bar dataKey="Spending" fill="#f97316" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
