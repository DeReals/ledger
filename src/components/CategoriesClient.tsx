"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  type ActionResult,
} from "@/app/(app)/categories/actions";
import type { Category, CategoryKind } from "@/lib/types";
import {
  Card,
  EmptyState,
  PageHeader,
  inputClass,
  labelClass,
  primaryBtn,
  secondaryBtn,
} from "@/components/ui";

// A friendly starter palette to pick from.
const PALETTE = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#64748b",
];

function CategoryForm({
  category,
  defaultKind,
  onDone,
}: {
  category?: Category;
  defaultKind?: CategoryKind;
  onDone: () => void;
}) {
  const isEdit = Boolean(category);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    isEdit ? updateCategory : createCategory,
    { error: null },
  );
  const [color, setColor] = useState(category?.color ?? "#6366f1");

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={category!.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Name</label>
          <input
            name="name"
            required
            defaultValue={category?.name}
            placeholder="e.g. Coffee"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Type</label>
          <select
            name="kind"
            defaultValue={category?.kind ?? defaultKind ?? "expense"}
            className={inputClass}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Color</label>
          <input type="hidden" name="color" value={color} />
          <div className="flex flex-wrap items-center gap-2">
            {PALETTE.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Choose ${c}`}
                className={`h-7 w-7 rounded-full transition ${
                  color === c
                    ? "ring-2 ring-slate-900 ring-offset-2 dark:ring-white dark:ring-offset-slate-900"
                    : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-7 w-9 cursor-pointer rounded border border-slate-300 bg-transparent dark:border-slate-700"
              aria-label="Custom color"
            />
          </div>
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primaryBtn}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Add category"}
        </button>
        <button type="button" onClick={onDone} className={secondaryBtn}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function CategoryList({
  title,
  categories,
  editingId,
  setEditingId,
}: {
  title: string;
  categories: Category[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
}) {
  return (
    <Card>
      <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">
        {title}
      </h2>
      {categories.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          None yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {categories.map((c) =>
            editingId === c.id ? (
              <li key={c.id}>
                <CategoryForm
                  category={c}
                  onDone={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
              >
                <span className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                  <span
                    className="inline-block h-4 w-4 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.name}
                </span>
                <span className="flex items-center gap-3">
                  <button
                    onClick={() => setEditingId(c.id)}
                    className="text-sm text-slate-400 hover:text-indigo-600"
                  >
                    Edit
                  </button>
                  <form
                    action={deleteCategory}
                    onSubmit={(e) => {
                      if (
                        !confirm(
                          `Delete "${c.name}"? Past transactions will become Uncategorized.`,
                        )
                      )
                        e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      className="text-sm text-slate-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </form>
                </span>
              </li>
            ),
          )}
        </ul>
      )}
    </Card>
  );
}

export function CategoriesClient({ categories }: { categories: Category[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const expenses = categories.filter((c) => c.kind === "expense");
  const income = categories.filter((c) => c.kind === "income");

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Organize your income and spending into categories."
        action={
          !adding && (
            <button onClick={() => setAdding(true)} className={primaryBtn}>
              + Add category
            </button>
          )
        }
      />

      {adding && (
        <Card className="mb-6">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">
            New category
          </h2>
          <CategoryForm onDone={() => setAdding(false)} />
        </Card>
      )}

      {categories.length === 0 && !adding ? (
        <EmptyState
          title="No categories yet"
          hint="Add categories to organize your transactions and budgets."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <CategoryList
            title="Expense categories"
            categories={expenses}
            editingId={editingId}
            setEditingId={setEditingId}
          />
          <CategoryList
            title="Income categories"
            categories={income}
            editingId={editingId}
            setEditingId={setEditingId}
          />
        </div>
      )}
    </div>
  );
}
