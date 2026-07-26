import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// In Next.js 16 "middleware" was renamed to "proxy". This runs
// before each request to keep the login session fresh and guard
// private pages. It runs on the Node.js runtime.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on all paths EXCEPT static files and images, which
     * don't need a login check (saves work / speeds things up).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
