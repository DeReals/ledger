import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { signIn } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  // Already logged in? Go straight to the app.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;
  const notice =
    params.message === "check-email"
      ? "Account created! Check your email to confirm your address, then log in."
      : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 dark:bg-stone-950">
      <AuthForm mode="login" action={signIn} notice={notice} />
    </main>
  );
}
