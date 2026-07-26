import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { signOut } from "@/app/auth/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 md:flex-row dark:bg-stone-950">
      {/* Sidebar */}
      <aside className="border-b border-stone-200 bg-white md:w-60 md:shrink-0 md:border-r md:border-b-0 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center gap-2 px-5 pt-5">
          <span className="text-lg font-bold text-orange-600">◆ Ledger</span>
        </div>
        <Sidebar />
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-3 dark:border-stone-800 dark:bg-stone-900">
          <span className="truncate text-sm text-stone-500 dark:text-stone-400">
            {user.email}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Sign out
            </button>
          </form>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
