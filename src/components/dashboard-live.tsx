"use client";

import { useState } from "react";
import Link from "next/link";
import { KPICard } from "@/components/kpi-card";
import { IncidentTable } from "@/components/incident-table";
import { Incident } from "@/lib/types";
import { Plus, Activity, Clock, CheckCircle2 } from "lucide-react";

interface DashboardLiveProps {
  initialIncidents: Incident[];
}

export function DashboardLive({ initialIncidents }: DashboardLiveProps) {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);

  const total = incidents.length;
  const pending = incidents.filter((i) => i.status === "pending").length;
  const resolved = incidents.filter((i) => i.status === "approved").length;

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            AI Assistant actively monitoring your cloud services in real-time
          </p>
        </div>

        <Link
          href="/settings"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all hover:shadow hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Simulate Error</span>
        </Link>
      </div>

      {/* 3 Apple-Style KPI Cards - Live Reactivity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <KPICard
          title="Total Incidents"
          value={total}
          subtitle="Errors tracked in database"
          icon={Activity}
          variant="cyan"
        />
        <KPICard
          title="Need Review"
          value={pending}
          subtitle={pending > 0 ? `${pending} fixes waiting for approval` : "All clear! No pending fixes"}
          icon={Clock}
          variant="amber"
          pulse={pending > 0}
        />
        <KPICard
          title="Resolved"
          value={resolved}
          subtitle="Autonomously patched or executed"
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Incident Table with Real-time & Polling synchronization */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Recent Incidents
          </h2>
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync Active
          </span>
        </div>
        <IncidentTable 
          initialIncidents={incidents} 
          onStatsChange={(updatedList) => setIncidents(updatedList)} 
        />
      </div>
    </div>
  );
}

