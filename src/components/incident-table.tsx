"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Incident } from "@/lib/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Search, 
  ArrowRight,
  Filter
} from "lucide-react";

interface IncidentTableProps {
  initialIncidents: Incident[];
  onStatsChange?: (incidents: Incident[]) => void;
}

export function IncidentTable({ initialIncidents, onStatsChange }: IncidentTableProps) {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  useEffect(() => {
    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel("incidents-realtime-table")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "incidents" },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const newRecord = payload.new as Incident;
              setIncidents((prev) => {
                const next = [newRecord, ...prev.filter((i) => i.id !== newRecord.id)];
                onStatsChange?.(next);
                return next;
              });
            } else if (payload.eventType === "UPDATE") {
              const updated = payload.new as Incident;
              setIncidents((prev) => {
                const next = prev.map((item) => (item.id === updated.id ? updated : item));
                onStatsChange?.(next);
                return next;
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      const interval = setInterval(async () => {
        try {
          const res = await fetch("/api/incidents");
          if (res.ok) {
            const data = await res.json();
            if (data.incidents) {
              setIncidents(data.incidents);
              onStatsChange?.(data.incidents);
            }
          }
        } catch {
          // ignore
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [onStatsChange]);

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.service_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || incident.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || incident.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Critical
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            High
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (incident: Incident) => {
    switch (incident.status) {
      case "approved":
        return (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
            </span>
            {incident.pr_url && (
              <a
                href={incident.pr_url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 hover:text-blue-700 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                title="View GitHub PR"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            Dismissed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3.5 h-3.5" /> Ready for Review
          </span>
        );
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search incidents or services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Ready for Review</option>
            <option value="approved">Resolved</option>
            <option value="rejected">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Spacious White Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500">
                <th className="py-4 px-6">Severity</th>
                <th className="py-4 px-6">Problem</th>
                <th className="py-4 px-6">Service</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Time</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">No incidents found</p>
                      <p className="text-xs text-slate-400">Everything is running smoothly right now.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => (
                  <tr
                    key={incident.id}
                    onClick={() => router.push(`/incident/${incident.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-5 px-6 whitespace-nowrap">
                      {getSeverityBadge(incident.severity)}
                    </td>
                    <td className="py-5 px-6 font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      <div className="line-clamp-1">{incident.title}</div>
                      <div className="text-xs font-normal text-slate-500 mt-1 line-clamp-1">
                        {incident.ai_analysis?.root_cause || "Analyzing problem..."}
                      </div>
                    </td>
                    <td className="py-5 px-6 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                        {incident.service_name}
                      </span>
                    </td>
                    <td className="py-5 px-6 whitespace-nowrap">
                      {getStatusBadge(incident)}
                    </td>
                    <td className="py-5 px-6 whitespace-nowrap text-xs text-slate-400 font-medium">
                      {formatTimeAgo(incident.created_at)}
                    </td>
                    <td className="py-5 px-6 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/incident/${incident.id}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition-all shadow-sm"
                      >
                        <span>{incident.status === "pending" ? "Review Fix" : "View"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
