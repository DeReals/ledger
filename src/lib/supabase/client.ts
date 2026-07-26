import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in the BROWSER (client components).
 * Used for things that happen after the page loads, like
 * live forms and buttons the user clicks.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
