import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { signUp } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <AuthForm mode="signup" action={signUp} />
    </main>
  );
}
