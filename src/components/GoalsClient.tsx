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

function GoalForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createGoal,
    { error: null },
  );

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Goal name</label>
          <input
            name="name"
            required
            placeholder="e.g. Emergency fund"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Target amount</label>
          <input
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
          <label className={labelClass}>Already saved (optional)</label>
          <input
            name="current_amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={0}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Target date (optional)</label>
          <input name="target_date" type="date" className={inputClass} />
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
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
        title="Savings goals"
        subtitle="Set targets and watch your progress grow."
        action={
          !adding && (
            <button onClick={() => setAdding(true)} className={primaryBtn}>
              + New goal
            </button>
          )
        }
      />

      {adding && (
        <Card className="mb-6">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">
            New goal
          </h2>
          <GoalForm onDone={() => setAdding(false)} />
        </Card>
      )}

      {goals.length === 0 && !adding ? (
        <EmptyState
          title="No goals yet"
          hint="Create a savings goal like an emergency fund or a vacation."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => {
            const target = Number(g.target_amount);
            const current = Number(g.current_amount);
            const pct =
              target > 0 ? Math.min(100, (current / target) * 100) : 0;
            const done = current >= target && target > 0;

            return (
              <Card key={g.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {g.name}
                    </p>
                    {g.target_date && (
                      <p className="text-xs text-slate-400">
                        by {formatDate(g.target_date)}
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
                      className="text-sm text-slate-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </form>
                </div>

                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full ${
                      done ? "bg-emerald-500" : "bg-indigo-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {formatMoney(current)} of {formatMoney(target)} ·{" "}
                  {pct.toFixed(0)}%
                  {done && " 🎉"}
                </p>

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
                  <span className="text-xs text-slate-400">
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
