import Link from "next/link";
import { notFound } from "next/navigation";
import { TerminalViewer } from "@/components/terminal-viewer";
import { MultiAgentStepper } from "@/components/multi-agent-stepper";
import { isServerSupabaseConfigured, supabaseAdmin, getMockStore } from "@/lib/supabase/server";
import { Incident } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

async function getIncident(id: string): Promise<Incident | null> {
  try {
    if (isServerSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from("incidents")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        return data as Incident;
      }
    }
  } catch (err) {
    console.error("Error fetching incident:", err);
  }

  const mock = getMockStore().find((i) => i.id === id);
  return mock || null;
}

export default async function IncidentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const incident = await getIncident(params.id);

  if (!incident) {
    notFound();
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Critical Severity
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
            High Severity
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Medium Severity
          </span>
        );
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full min-h-screen">
      {/* 1. Header Bar (Clean & Minimalist - Service billing line removed) */}
      <div className="space-y-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        <div>
          <div className="flex items-center gap-2 mb-1">
            {getSeverityBadge(incident.severity)}
            <span className="text-xs font-mono text-slate-400">
              INC-{incident.id.slice(0, 8)}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {incident.title}
          </h1>
        </div>
      </div>

      {/* 2. Multi-Agent Orchestration Tree (Main AI at top center, Workers below) */}
      <section>
        <MultiAgentStepper
          analysis={incident.ai_analysis}
          suggestedAction={incident.suggested_action}
          workflow={incident.multi_agent_workflow || incident.ai_analysis?.multi_agent_workflow}
          incident={incident}
        />
      </section>

      {/* 3. Original Error Log (Sabse Niche, In Clean White Theme) */}
      <section className="space-y-2 pt-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Original Error Telemetry
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Runtime crash trace captured before remediation
          </p>
        </div>

        <TerminalViewer
          rawLog={incident.raw_log}
          serviceName={incident.service_name}
          environment={incident.environment}
          timestamp={incident.created_at}
        />
      </section>
    </div>
  );
}
