"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  createRecurring,
  deleteRecurring,
  postDue,
  type ActionResult,
} from "@/app/(app)/recurring/actions";
import type {
  Account,
  Category,
  Frequency,
  RecurringTransaction,
  TransactionType,
} from "@/lib/types";
import { formatMoney, formatDate, todayISO } from "@/lib/format";
import {
  Card,
  EmptyState,
  PageHeader,
  inputClass,
  labelClass,
  primaryBtn,
  secondaryBtn,
} from "@/components/ui";

type Props = {
  recurring: RecurringTransaction[];
  accounts: Account[];
  categories: Category[];
};

const FREQ_LABELS: Record<Frequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

function RecurringForm({
  accounts,
  categories,
  onDone,
}: {
  accounts: Account[];
  categories: Category[];
  onDone: () => void;
}) {
  const [type, setType] = useState<TransactionType>("expense");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createRecurring,
    { error: null },
  );

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  const relevantCategories = categories.filter((c) =>
    type === "income" ? c.kind === "income" : c.kind === "expense",
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex gap-2">
        {(["expense", "income"] as TransactionType[]).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ${
              type === t
                ? "border-orange-600 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                : "border-stone-300 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <input type="hidden" name="type" value={type} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Amount</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Frequency</label>
          <select name="frequency" defaultValue="monthly" className={inputClass}>
            {Object.entries(FREQ_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Account</label>
          <select
            name="account_id"
            required
            defaultValue={accounts[0]?.id}
            className={inputClass}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select name="category_id" defaultValue="" className={inputClass}>
            <option value="">Uncategorized</option>
            {relevantCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Next date</label>
          <input
            name="next_date"
            type="date"
            required
            defaultValue={todayISO()}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Description (optional)</label>
          <input
            name="description"
            placeholder="e.g. Netflix"
            className={inputClass}
          />
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primaryBtn}>
          {pending ? "Saving…" : "Add recurring item"}
        </button>
        <button type="button" onClick={onDone} className={secondaryBtn}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function RecurringClient({ recurring, accounts, categories }: Props) {
  const [adding, setAdding] = useState(false);
  const noAccounts = accounts.length === 0;

  const accountName = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts],
  );
  const categoryName = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const today = todayISO();
  const dueCount = recurring.filter(
    (r) => r.active && r.next_date <= today,
  ).length;

  return (
    <div>
      <PageHeader
        title="Recurring"
        subtitle="Automate bills, subscriptions, salary, and rent."
        action={
          !adding &&
          !noAccounts && (
            <button onClick={() => setAdding(true)} className={primaryBtn}>
              + Add recurring
            </button>
          )
        }
      />

      {noAccounts && (
        <EmptyState
          title="Add an account first"
          hint="You need an account before setting up recurring transactions."
        />
      )}

      {dueCount > 0 && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {dueCount} recurring{" "}
            {dueCount === 1 ? "item is" : "items are"} due to be posted.
          </span>
          <form action={postDue}>
            <button
              type="submit"
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              Post due now
            </button>
          </form>
        </Card>
      )}

      {adding && !noAccounts && (
        <Card className="mb-6">
          <h2 className="mb-4 font-semibold text-stone-900 dark:text-white">
            New recurring item
          </h2>
          <RecurringForm
            accounts={accounts}
            categories={categories}
            onDone={() => setAdding(false)}
          />
        </Card>
      )}

      {!noAccounts && recurring.length === 0 && !adding ? (
        <EmptyState
          title="No recurring items yet"
          hint="Add subscriptions, salary, rent, and other repeating transactions."
        />
      ) : (
        <div className="space-y-2">
          {recurring.map((r) => {
            const due = r.active && r.next_date <= today;
            return (
              <div
                key={r.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-stone-900 dark:text-white">
                    {r.description ||
                      (r.category_id
                        ? categoryName.get(r.category_id)
                        : "Recurring")}
                  </p>
                  <p className="truncate text-sm text-stone-500 dark:text-stone-400">
                    {FREQ_LABELS[r.frequency]} · {accountName.get(r.account_id)}{" "}
                    · next {formatDate(r.next_date)}
                    {due && (
                      <span className="ml-1 font-medium text-amber-600">
                        (due)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-semibold tabular-nums ${
                      r.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {r.type === "income" ? "+" : "−"}
                    {formatMoney(Number(r.amount))}
                  </span>
                  <form
                    action={deleteRecurring}
                    onSubmit={(e) => {
                      if (!confirm("Delete this recurring item?"))
                        e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="text-sm text-stone-400 hover:text-rose-600"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
