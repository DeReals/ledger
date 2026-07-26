"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type ActionResult,
} from "@/app/(app)/transactions/actions";
import type {
  Account,
  Category,
  Transaction,
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
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
};

function TransactionForm({
  accounts,
  categories,
  transaction,
  onDone,
}: {
  accounts: Account[];
  categories: Category[];
  transaction?: Transaction;
  onDone: () => void;
}) {
  const isEdit = Boolean(transaction);
  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? "expense",
  );
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    isEdit ? updateTransaction : createTransaction,
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
      {isEdit && <input type="hidden" name="id" value={transaction!.id} />}

      {/* Type toggle */}
      <div className="flex gap-2">
        {(["expense", "income", "transfer"] as TransactionType[]).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ${
              type === t
                ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
            defaultValue={transaction?.amount}
            placeholder="0.00"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Date</label>
          <input
            name="date"
            type="date"
            required
            defaultValue={transaction?.date ?? todayISO()}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            {type === "transfer" ? "From account" : "Account"}
          </label>
          <select
            name="account_id"
            required
            defaultValue={transaction?.account_id ?? accounts[0]?.id}
            className={inputClass}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {type === "transfer" ? (
          <div>
            <label className={labelClass}>To account</label>
            <select
              name="transfer_account_id"
              required
              defaultValue={transaction?.transfer_account_id ?? ""}
              className={inputClass}
            >
              <option value="">Select…</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className={labelClass}>Category</label>
            <select
              name="category_id"
              defaultValue={transaction?.category_id ?? ""}
              className={inputClass}
            >
              <option value="">Uncategorized</option>
              {relevantCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="sm:col-span-2">
          <label className={labelClass}>Description (optional)</label>
          <input
            name="description"
            defaultValue={transaction?.description ?? ""}
            placeholder="e.g. Weekly grocery run"
            className={inputClass}
          />
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primaryBtn}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Add transaction"}
        </button>
        <button type="button" onClick={onDone} className={secondaryBtn}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function TransactionsClient({
  transactions,
  accounts,
  categories,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const accountName = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts],
  );
  const categoryName = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );
  const accountCurrency = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.currency])),
    [accounts],
  );

  const noAccounts = accounts.length === 0;

  function describe(t: Transaction): string {
    if (t.type === "transfer") {
      return `Transfer → ${accountName.get(t.transfer_account_id ?? "") ?? "—"}`;
    }
    return t.category_id
      ? (categoryName.get(t.category_id) ?? "Uncategorized")
      : "Uncategorized";
  }

  function sign(t: Transaction): string {
    if (t.type === "income") return "+";
    if (t.type === "expense") return "−";
    return "";
  }

  function color(t: Transaction): string {
    if (t.type === "income") return "text-emerald-600 dark:text-emerald-400";
    if (t.type === "expense") return "text-red-600 dark:text-red-400";
    return "text-slate-600 dark:text-slate-300";
  }

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Every dollar in and out."
        action={
          !adding &&
          !noAccounts && (
            <button onClick={() => setAdding(true)} className={primaryBtn}>
              + Add transaction
            </button>
          )
        }
      />

      {noAccounts && (
        <EmptyState
          title="Add an account first"
          hint="You need at least one account before logging transactions. Head to the Accounts page."
        />
      )}

      {adding && !noAccounts && (
        <Card className="mb-6">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">
            New transaction
          </h2>
          <TransactionForm
            accounts={accounts}
            categories={categories}
            onDone={() => setAdding(false)}
          />
        </Card>
      )}

      {!noAccounts && transactions.length === 0 && !adding ? (
        <EmptyState
          title="No transactions yet"
          hint="Log your first income or expense to get started."
        />
      ) : (
        <div className="space-y-2">
          {transactions.map((t) =>
            editingId === t.id ? (
              <Card key={t.id}>
                <TransactionForm
                  accounts={accounts}
                  categories={categories}
                  transaction={t}
                  onDone={() => setEditingId(null)}
                />
              </Card>
            ) : (
              <div
                key={t.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900 dark:text-white">
                    {t.description || describe(t)}
                  </p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(t.date)} · {accountName.get(t.account_id)} ·{" "}
                    {describe(t)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-semibold tabular-nums ${color(t)}`}
                  >
                    {sign(t)}
                    {formatMoney(
                      t.amount,
                      accountCurrency.get(t.account_id) ?? "USD",
                    )}
                  </span>
                  <button
                    onClick={() => setEditingId(t.id)}
                    className="text-sm text-slate-400 hover:text-indigo-600"
                  >
                    Edit
                  </button>
                  <form
                    action={deleteTransaction}
                    onSubmit={(e) => {
                      if (!confirm("Delete this transaction?"))
                        e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="id" value={t.id} />
                    <button
                      type="submit"
                      className="text-sm text-slate-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
