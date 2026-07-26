import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Use this at the top of any protected page or action. It returns
 * the logged-in user and a ready-to-use Supabase client, or sends
 * the visitor to the login page if they're not signed in.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}
