import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  // If already logged in, skip the marketing page.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-6 text-center dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-2xl">
        <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          Your money, organized
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          Take control of your finances
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-400">
          A private financial ledger to track every account, log transactions,
          set budgets, watch your net worth grow, and reach your savings goals.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-700"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 transition hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
