import Link from "next/link";
import { notFound } from "next/navigation";
import { TerminalViewer } from "@/components/terminal-viewer";
import { AIRemediationCard } from "@/components/ai-remediation-card";
import { ApprovalDock } from "@/components/approval-dock";
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
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Critical
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            High
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Medium
          </span>
        );
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-6xl flex flex-col min-h-screen">
      {/* Top Navigation */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Incident Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            {getSeverityBadge(incident.severity)}
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {incident.title}
            </h1>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Service: <strong className="text-slate-700 font-semibold">{incident.service_name}</strong> •{" "}
            Detected {new Date(incident.created_at).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[500px]">
        {/* Left Side: Original Log */}
        <div className="h-[500px] lg:h-auto">
          <TerminalViewer
            rawLog={incident.raw_log}
            serviceName={incident.service_name}
            environment={incident.environment}
            timestamp={incident.created_at}
          />
        </div>

        {/* Right Side: AI Suggested Solution */}
        <div className="h-[500px] lg:h-auto">
          <AIRemediationCard
            analysis={incident.ai_analysis}
            suggestedAction={incident.suggested_action}
          />
        </div>
      </div>

      {/* Bottom Floating Approval Dock */}
      <div className="sticky bottom-6 z-30 pt-2">
        <ApprovalDock incident={incident} />
      </div>
    </div>
  );
}
