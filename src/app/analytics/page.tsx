import { ROICharts } from "@/components/roi-charts";
import { isServerSupabaseConfigured, supabaseAdmin, getMockStore } from "@/lib/supabase/server";
import { Incident } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getIncidents(): Promise<Incident[]> {
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
    console.error("Fetch incidents error in analytics:", err);
  }

  return getMockStore();
}

export default async function AnalyticsPage() {
  const incidents = await getIncidents();

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Analytics & Impact
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">
          Real-time metrics, engineering hours saved, and AI resolution telemetry
        </p>
      </div>

      <ROICharts initialIncidents={incidents} />
    </div>
  );
}
