"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/format";

function formatDuration(days: number): string {
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"}`;
  const months = Math.ceil(days / 30.4375);
  if (months < 12) return `about ${months} ${months === 1 ? "month" : "months"}`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths === 0
    ? `about ${years} ${years === 1 ? "year" : "years"}`
    : `about ${years} ${years === 1 ? "year" : "years"} and ${remainingMonths} ${remainingMonths === 1 ? "month" : "months"}`;
}

export function DebtPayoffProjection({
  debt,
  currency,
  suggestedDailyPayment,
}: {
  debt: number;
  currency: string;
  suggestedDailyPayment: number;
}) {
  const [dailyPayment, setDailyPayment] = useState(
    suggestedDailyPayment > 0 ? suggestedDailyPayment.toFixed(2) : "",
  );
  const payment = Number(dailyPayment);
  const daysToPayoff =
    debt > 0 && payment > 0 ? Math.ceil(debt / payment) : null;

  return (
    <Card>
      <div>
        <h2 className="font-semibold text-stone-900 dark:text-white">
          Debt-free projection
        </h2>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Try a daily payment amount and see how quickly it could add up.
        </p>
      </div>

      {debt <= 0 ? (
        <p className="mt-5 rounded-2xl bg-emerald-50 p-4 font-medium text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          No debt recorded. Keep building savings and avoid taking on new debt.
        </p>
      ) : (
        <>
          <label
            htmlFor="daily-debt-payment"
            className="mt-5 block text-sm font-medium text-stone-700 dark:text-stone-300"
          >
            I can put toward debt each day
          </label>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {currency}
            </span>
            <input
              id="daily-debt-payment"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={dailyPayment}
              onChange={(event) => setDailyPayment(event.target.value)}
              className="w-full max-w-48 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
            />
            {suggestedDailyPayment > 0 && (
              <span className="text-xs text-stone-400">
                Suggested from this month&apos;s surplus
              </span>
            )}
          </div>

          <div
            aria-live="polite"
            className="mt-4 rounded-2xl bg-orange-50 p-4 dark:bg-orange-950/30"
          >
            {daysToPayoff ? (
              <>
                <p className="text-sm text-stone-600 dark:text-stone-300">
                  At {formatMoney(payment, currency)} per day, your{" "}
                  {formatMoney(debt, currency)} in recorded debt could take
                </p>
                <p className="mt-1 text-2xl font-bold text-stone-900 dark:text-white">
                  {formatDuration(daysToPayoff)}
                </p>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  That&apos;s about {formatMoney(payment * 30, currency)} per
                  month. Increase or lower the daily amount to explore a
                  realistic pace.
                </p>
              </>
            ) : (
              <p className="text-sm text-stone-700 dark:text-stone-200">
                Enter a daily payment above zero to see an estimated payoff
                time.
              </p>
            )}
          </div>
          <p className="mt-3 text-xs text-stone-400">
            Estimate only; it doesn&apos;t include interest, fees, or new
            borrowing. Keep making required minimum payments.
          </p>
        </>
      )}
    </Card>
  );
}
