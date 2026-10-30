"use client";

import { useState } from "react";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  GitPullRequest, 
  Terminal,
  Server,
  Sparkles
} from "lucide-react";
import { Incident } from "@/lib/types";

interface ApprovalDockProps {
  incident: Incident;
  onStatusUpdated?: (updated: Incident) => void;
}

export function ApprovalDock({ incident, onStatusUpdated }: ApprovalDockProps) {
  const [currentIncident, setCurrentIncident] = useState<Incident>(incident);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const action = currentIncident.suggested_action || currentIncident.ai_analysis?.suggested_action;
  const isInfra = 
    action?.category === "infra" || 
    action?.action_type === "infra_command" ||
    currentIncident.multi_agent_workflow?.ops_agent?.routing_decision === "infra_agent" ||
    Boolean(action?.terminal_command);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/incidents/${currentIncident.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved_by: "Alex Chen" }),
      });

      if (!res.ok) {
        throw new Error("Approval failed");
      }

      const data = await res.json();
      const updated: Incident = {
        ...currentIncident,
        status: "approved",
        pr_url: data.pr_url,
        pr_number: data.pr_number,
        pr_branch: data.pr_branch,
        executed_command: data.executed_command || action?.terminal_command,
        approved_at: data.approved_at,
      };

      setCurrentIncident(updated);
      onStatusUpdated?.(updated);

      if (isInfra) {
        toast.success("Command executed on target server", {
          description: `Environment: ${action?.target_environment || currentIncident.environment} • Exit code: 0`,
          duration: 6000,
        });
      } else {
        toast.success(
          data.simulated
            ? `Patch approved! GitHub PR #${data.pr_number} created (Simulated).`
            : `Patch approved! GitHub Pull Request #${data.pr_number} created.`,
          {
            description: `Target branch: ${data.pr_branch}`,
            duration: 6000,
          }
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(isInfra ? "Failed to execute server command." : "Failed to open GitHub PR.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const res = await fetch(`/api/incidents/${currentIncident.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejection_reason: "Dismissed by user" }),
      });

      if (!res.ok) {
        throw new Error("Rejection failed");
      }

      const data = await res.json();
      const updated: Incident = {
        ...currentIncident,
        status: "rejected",
        rejected_at: data.rejected_at,
      };

      setCurrentIncident(updated);
      onStatusUpdated?.(updated);

      toast.info("Incident dismissed without changes.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject.");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 border-t border-gray-200 bg-white p-5 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Left Details */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
          currentIncident.status === "approved"
            ? "bg-emerald-50 text-emerald-600"
            : currentIncident.status === "rejected"
            ? "bg-slate-100 text-slate-400"
            : isInfra
            ? "bg-amber-50 text-amber-600"
            : "bg-blue-50 text-blue-600"
        }`}>
          {currentIncident.status === "approved" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : currentIncident.status === "rejected" ? (
            <XCircle className="w-5 h-5 text-slate-400" />
          ) : isInfra ? (
            <Terminal className="w-5 h-5 text-amber-600" />
          ) : (
            <GitPullRequest className="w-5 h-5 text-blue-600" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">
              {currentIncident.status === "approved"
                ? isInfra ? "Command Executed on Target Server!" : "Pull Request Created on GitHub!"
                : currentIncident.status === "rejected"
                ? "Incident Dismissed"
                : isInfra ? "Human-in-the-Loop Infra Execution" : "Human-in-the-Loop Code Review"}
            </h4>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              isInfra ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
            }`}>
              {isInfra ? "Infra Action" : "Code Action"}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {currentIncident.status === "approved"
              ? isInfra
                ? `CLI command executed on ${action?.target_environment || currentIncident.environment}. Service restored.`
                : "Hotfix branch committed and pull request ready for review."
              : currentIncident.status === "rejected"
              ? "This error was closed without making changes."
              : isInfra
              ? "Manager AI routed to Infra AI. Authorize command execution on the target server."
              : "Manager AI routed to Coder AI. Authorize automated branch creation & GitHub PR."}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {currentIncident.status === "pending" ? (
          <>
            <button
              onClick={handleReject}
              disabled={isRejecting || isApproving}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
            >
              {isRejecting ? "Dismissing..." : "Dismiss"}
            </button>

            {/* Dynamic Action Button depending on Situation A vs Situation B */}
            <button
              onClick={handleApprove}
              disabled={isApproving || isRejecting}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] ${
                isInfra
                  ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
              }`}
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isInfra ? "Executing Command..." : "Opening GitHub PR..."}</span>
                </>
              ) : isInfra ? (
                <>
                  <Terminal className="w-4 h-4" />
                  <span>Approve & Execute Command</span>
                </>
              ) : (
                <>
                  <GitPullRequest className="w-4 h-4" />
                  <span>Approve & Open GitHub PR</span>
                </>
              )}
            </button>
          </>
        ) : currentIncident.status === "approved" ? (
          <div className="flex items-center gap-3">
            {isInfra ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-xs font-mono font-semibold text-slate-800 border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Command Executed: Exit Code 0</span>
              </div>
            ) : currentIncident.pr_url ? (
              <a
                href={currentIncident.pr_url}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
              >
                <GitPullRequest className="w-4 h-4" />
                <span>View Pull Request #{currentIncident.pr_number || "Open"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : null}
          </div>
        ) : (
          <span className="text-xs font-medium text-slate-500 px-3 py-1.5 rounded-xl bg-slate-100">
            Closed
          </span>
        )}
      </div>
    </div>
  );
}
