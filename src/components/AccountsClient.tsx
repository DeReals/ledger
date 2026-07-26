"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createAccount,
  updateAccount,
  deleteAccount,
  type ActionResult,
} from "@/app/(app)/accounts/actions";
import {
  ACCOUNT_TYPE_LABELS,
  type Account,
  type AccountType,
} from "@/lib/types";
import { formatMoney } from "@/lib/format";
import {
  Card,
  EmptyState,
  PageHeader,
  inputClass,
  labelClass,
  primaryBtn,
  secondaryBtn,
} from "@/components/ui";

type AccountRow = Account & { balance: number };

const TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_LABELS) as [
  AccountType,
  string,
][];

function AccountForm({
  account,
  onDone,
}: {
  account?: AccountRow;
  onDone: () => void;
}) {
  const isEdit = Boolean(account);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    isEdit ? updateAccount : createAccount,
    { error: null },
  );

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={account!.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Account name</label>
          <input
            name="name"
            required
            defaultValue={account?.name}
            placeholder="e.g. Main Checking"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Type</label>
          <select
            name="type"
            defaultValue={account?.type ?? "checking"}
            className={inputClass}
          >
            {TYPE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Currency</label>
          <input
            name="currency"
            defaultValue={account?.currency ?? "USD"}
            maxLength={3}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Starting balance</label>
          <input
            name="starting_balance"
            type="number"
            step="0.01"
            defaultValue={account?.starting_balance ?? 0}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-400">
            What&apos;s in the account right now, before you log any
            transactions.
          </p>
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primaryBtn}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Add account"}
        </button>
        <button type="button" onClick={onDone} className={secondaryBtn}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function AccountsClient({ accounts }: { accounts: AccountRow[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const total = accounts.reduce((sum, a) => sum + a.balance, 0);
  const currency = accounts[0]?.currency ?? "USD";

  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle="Your checking, savings, credit cards, cash, and more."
        action={
          !adding && (
            <button onClick={() => setAdding(true)} className={primaryBtn}>
              + Add account
            </button>
          )
        }
      />

      {adding && (
        <Card className="mb-6">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">
            New account
          </h2>
          <AccountForm onDone={() => setAdding(false)} />
        </Card>
      )}

      {accounts.length === 0 && !adding ? (
        <EmptyState
          title="No accounts yet"
          hint="Add your first account to start tracking your money."
        />
      ) : (
        <div className="space-y-3">
          {accounts.map((a) =>
            editingId === a.id ? (
              <Card key={a.id}>
                <AccountForm
                  account={a}
                  onDone={() => setEditingId(null)}
                />
              </Card>
            ) : (
              <Card
                key={a.id}
                className="flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {a.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {ACCOUNT_TYPE_LABELS[a.type]}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-lg font-semibold tabular-nums ${
                      a.balance < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {formatMoney(a.balance, a.currency)}
                  </span>
                  <button
                    onClick={() => setEditingId(a.id)}
                    className="text-sm text-slate-500 hover:text-indigo-600"
                  >
                    Edit
                  </button>
                  <form
                    action={deleteAccount}
                    onSubmit={(e) => {
                      if (
                        !confirm(
                          `Delete "${a.name}"? This also deletes its transactions.`,
                        )
                      )
                        e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="id" value={a.id} />
                    <button
                      type="submit"
                      className="text-sm text-slate-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </Card>
            ),
          )}

          {accounts.length > 0 && (
            <div className="flex items-center justify-between px-5 pt-2 text-slate-900 dark:text-white">
              <span className="font-medium">Total</span>
              <span className="text-lg font-bold tabular-nums">
                {formatMoney(total, currency)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
