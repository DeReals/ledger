"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthState } from "@/app/auth/actions";

type Props = {
  mode: "login" | "signup";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  notice?: string | null;
};

export function AuthForm({ mode, action, notice }: Props) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    { error: null },
  );

  const isLogin = mode === "login";

  return (
    <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-white">
        {isLogin ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        {isLogin
          ? "Log in to your ledger."
          : "Start tracking your finances today."}
      </p>

      {notice && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {notice}
        </p>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-stone-700 dark:text-stone-300"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-stone-700 dark:text-stone-300"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={8}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
          />
          {!isLogin && (
            <p className="mt-1 text-xs text-stone-400">
              At least 8 characters.
            </p>
          )}
        </div>

        {state.error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-orange-600 px-4 py-2.5 font-medium text-white transition hover:bg-orange-700 disabled:opacity-60"
        >
          {pending
            ? "Please wait…"
            : isLogin
              ? "Log in"
              : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
        {isLogin ? (
          <>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-orange-600 hover:underline"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-orange-600 hover:underline"
            >
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
