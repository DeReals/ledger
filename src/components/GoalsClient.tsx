"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createGoal,
  contribute,
  deleteGoal,
  type ActionResult,
} from "@/app/(app)/goals/actions";
import type { Goal } from "@/lib/types";
import { formatMoney, formatDate } from "@/lib/format";
import {
  Card,
  EmptyState,
  PageHeader,
  inputClass,
  labelClass,
  primaryBtn,
  secondaryBtn,
} from "@/components/ui";
import { todayISO } from "@/lib/format";

const COMMON_SINKING_FUNDS = [
  "Car maintenance (oil change, tires, repairs)",
  "Car registration and insurance",
  "Medical and dental costs",
  "Annual subscriptions and bills",
  "Holiday and gifts",
  "Home repairs",
];

function monthlySetAside(
  target: number,
  current: number,
  targetDate: string | null,
): { amount: number; overdue: boolean } | null {
  if (!targetDate) return null;
  const remaining = Math.max(0, target - current);
  if (remaining === 0) return { amount: 0, overdue: false };

  const today = new Date(`${todayISO()}T00:00:00Z`).getTime();
  const dueDate = new Date(`${targetDate}T00:00:00Z`).getTime();
  const daysUntilDue = Math.ceil((dueDate - today) / 86_400_000);
  if (daysUntilDue <= 0) return { amount: remaining, overdue: true };

  const monthsUntilDue = daysUntilDue / 30.4375;
  return { amount: remaining / monthsUntilDue, overdue: false };
}

function GoalForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createGoal,
    { error: null },
  );

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="sinking-fund-example">
          Common sinking fund examples
        </label>
        <select
          id="sinking-fund-example"
          value=""
          onChange={(event) => {
            if (event.target.value) setName(event.target.value);
          }}
          className={inputClass}
        >
          <option value="">Choose an example or enter your own</option>
          {COMMON_SINKING_FUNDS.map((example) => (
            <option key={example} value={example}>
              {example}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="goal-name">
            Fund name
          </label>
          <input
            id="goal-name"
            name="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Oil change"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="goal-target">
            Expected cost
          </label>
          <input
            id="goal-target"
            name="target_amount"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="5000"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="goal-current">
            Already set aside
          </label>
          <input
            id="goal-current"
            name="current_amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={0}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="goal-date">
            When will you need it?
          </label>
          <input
            id="goal-date"
            name="target_date"
            type="date"
            min={todayISO()}
            className={inputClass}
          />
        </div>
      </div>
      <p className="text-sm text-stone-500 dark:text-stone-400">
        Set aside a little at a time for predictable costs, so they don&apos;t
        become emergencies or go on a credit card.
      </p>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primaryBtn}>
          {pending ? "Saving…" : "Create goal"}
        </button>
        <button type="button" onClick={onDone} className={secondaryBtn}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function GoalsClient({ goals }: { goals: Goal[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <PageHeader
        title="Savings & sinking funds"
        subtitle="Prepare for known future costs by setting aside a little at a time."
        action={
          !adding && (
            <button onClick={() => setAdding(true)} className={primaryBtn}>
              + New fund
            </button>
          )
        }
      />

      {adding && (
        <Card className="mb-6">
          <h2 className="mb-4 font-semibold text-stone-900 dark:text-white">
            New sinking fund or savings goal
          </h2>
          <GoalForm onDone={() => setAdding(false)} />
        </Card>
      )}

      {goals.length === 0 && !adding ? (
        <EmptyState
          title="Prepare for the costs you know are coming"
          hint="Create a fund for an oil change, car insurance, annual bills, or any predictable expense. Add a target date to see how much to set aside each month."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => {
            const target = Number(g.target_amount);
            const current = Number(g.current_amount);
            const pct =
              target > 0 ? Math.min(100, (current / target) * 100) : 0;
            const done = current >= target && target > 0;
            const plan = monthlySetAside(
              target,
              current,
              g.target_date,
            );

            return (
              <Card key={g.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-stone-900 dark:text-white">
                      {g.name}
                    </p>
                    {g.target_date && (
                      <p className="text-xs text-stone-400">
                        {plan?.overdue
                          ? `Due ${formatDate(g.target_date)} · needs funding`
                          : `Needed by ${formatDate(g.target_date)}`}
                      </p>
                    )}
                  </div>
                  <form
                    action={deleteGoal}
                    onSubmit={(e) => {
                      if (!confirm(`Delete goal "${g.name}"?`))
                        e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="id" value={g.id} />
                    <button
                      type="submit"
                      className="text-sm text-stone-400 hover:text-rose-600"
                    >
                      ✕
                    </button>
                  </form>
                </div>

                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                  <div
                    className={`h-full rounded-full ${
                      done ? "bg-emerald-500" : "bg-orange-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                  {formatMoney(current)} of {formatMoney(target)} ·{" "}
                  {pct.toFixed(0)}%
                  {done && " 🎉"}
                </p>
                {plan && !done && (
                  <p
                    className={`mt-2 rounded-lg px-3 py-2 text-sm ${
                      plan.overdue
                        ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                        : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                    }`}
                  >
                    {plan.overdue
                      ? `This date has passed. ${formatMoney(plan.amount)} remains to set aside.`
                      : `Aim to set aside about ${formatMoney(plan.amount)} per month to be ready.`}
                  </p>
                )}

                <form
                  action={contribute}
                  className="mt-3 flex items-center gap-2"
                >
                  <input type="hidden" name="id" value={g.id} />
                  <input
                    name="delta"
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    className={`${inputClass} w-28`}
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Add
                  </button>
                  <span className="text-xs text-stone-400">
                    (use a negative amount to withdraw)
                  </span>
                </form>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
