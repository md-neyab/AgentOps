import { DashboardLive } from "@/components/dashboard-live";
import { isServerSupabaseConfigured, supabaseAdmin, getMockStore } from "@/lib/supabase/server";
import { Incident } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function getInitialIncidents(): Promise<Incident[]> {
  try {
    if (isServerSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Incident[];
      }
    }
  } catch (err) {
    console.error("Fetch error on dashboard:", err);
  }

  return getMockStore();
}

export default async function DashboardPage() {
  const incidents = await getInitialIncidents();

  return <DashboardLive initialIncidents={incidents} />;
}
