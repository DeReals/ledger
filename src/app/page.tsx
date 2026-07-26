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
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 px-6 text-center dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <div className="max-w-2xl">
        <span className="inline-block rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-300">
          Your money, organized
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl dark:text-white">
          Take control of your finances
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600 dark:text-stone-400">
          A private financial ledger to track every account, log transactions,
          set budgets, watch your net worth grow, and reach your savings goals.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-orange-600 px-6 py-3 font-medium text-white transition hover:bg-orange-700"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-stone-300 px-6 py-3 font-medium text-stone-700 transition hover:bg-white dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
