import { requireUser } from "@/lib/auth";
import { GoalsClient } from "@/components/GoalsClient";
import type { Goal } from "@/lib/types";

export default async function GoalsPage() {
  const { supabase } = await requireUser();
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: true });

  return <GoalsClient goals={(goals as Goal[]) ?? []} />;
}
