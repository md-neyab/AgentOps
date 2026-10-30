"use client";

import { useState } from "react";
import { toast } from "sonner";
import { 
  AIAnalysis, 
  SuggestedAction, 
  MultiAgentWorkflow,
  Incident,
  isInfraRouting
} from "@/lib/types";
import { 
  Terminal, 
  FileCode2, 
  CheckCircle2, 
  Copy, 
  Check, 
  GitBranch, 
  ExternalLink, 
  Loader2,
  GitPullRequest,
  CheckCircle,
  Ban,
  ArrowRight
} from "lucide-react";

// Official Google Gemini 4-pointed sparkle logo SVG
export function GeminiIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="geminiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4E82EE" />
          <stop offset="35%" stopColor="#6C5CE7" />
          <stop offset="70%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <path
        d="M12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24Z"
        fill="url(#geminiGradient)"
      />
    </svg>
  );
}

interface MultiAgentStepperProps {
  analysis: AIAnalysis | null;
  suggestedAction: SuggestedAction | null;
  workflow?: MultiAgentWorkflow | null;
  incident: Incident;
  onStatusUpdated?: (updated: Incident) => void;
}

export function MultiAgentStepper({
  analysis,
  suggestedAction,
  workflow,
  incident,
  onStatusUpdated,
}: MultiAgentStepperProps) {
  const [currentIncident, setCurrentIncident] = useState<Incident>(incident);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const [copiedDiff, setCopiedDiff] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);

  const action = suggestedAction || analysis?.suggested_action;
  const rawRouting = 
    workflow?.ops_agent?.routing_decision || 
    analysis?.multi_agent_workflow?.ops_agent?.routing_decision;

  // Detect whether this incident is Situation A (Code) or Situation B (Infra)
  const isInfra = 
    action?.category === "infra" || 
    action?.action_type === "infra_command" ||
    isInfraRouting(rawRouting) ||
    Boolean(action?.terminal_command);

  // Fallback workflow object if not present
  const currentWorkflow: MultiAgentWorkflow = workflow || analysis?.multi_agent_workflow || {
    triage_agent: {
      agent_name: "Agent Alpha (Triage & Alert)",
      severity: analysis?.severity || "high",
      root_cause: analysis?.root_cause || "Anomaly detected in execution pipeline.",
      needs_senior_escalation: analysis?.severity === "critical",
      simulated_slack_alert_text: `🚨 [${(analysis?.severity || "high").toUpperCase()}] Issue detected in production service.`,
      anomaly_confidence: analysis?.confidence_score || 0.98,
    },
    ops_agent: {
      agent_name: "Agent Beta (Manager AI & Ops Coordinator)",
      assigned_team: isInfra ? "Payment Ops" : "Platform Core / SRE Squad",
      jira_ticket_title: analysis?.title || "OPS-4091: Incident Investigation",
      priority_level: analysis?.severity === "critical" ? "P0 - Blocker" : "P1 - High",
      sla_target: analysis?.severity === "critical" ? "15 minutes" : "1 hour",
      routing_decision: isInfra ? "infra_agent" : "coder_agent",
      routing_reason: isInfra 
        ? "Operational saturation requiring infrastructure restart command."
        : "Defect identified in application logic requiring a Git patch.",
    },
    coder_agent: !isInfra ? {
      agent_name: "Coder AI (Remediation Coder)",
      file_path: action?.file_path || "src/handler.ts",
      patch_content: action?.patch_content || "@@ -1,1 +1,2 @@\n+// Applied hotfix",
      branch_name: action?.branch_name || "hotfix/auto-remediation",
      commit_message: action?.pr_title || "fix: automated remediation patch",
    } : null,
    infra_agent: isInfra ? {
      agent_name: "Infra AI (Server Operations)",
      terminal_command: action?.terminal_command || "kubectl rollout restart deployment/service -n production",
      target_environment: action?.target_environment || "production",
      estimated_impact: action?.estimated_impact || "Graceful rolling restart of container pods with zero downtime.",
    } : null,
    orchestrated_at: "2026-10-30T12:00:00.000Z",
    total_duration_ms: 1192,
  };

  const handleCopyDiff = () => {
    const diff = action?.patch_content || currentWorkflow.coder_agent?.patch_content;
    if (diff) {
      navigator.clipboard.writeText(diff);
      setCopiedDiff(true);
      setTimeout(() => setCopiedDiff(false), 2000);
    }
  };

  const handleCopyCommand = () => {
    const cmd = action?.terminal_command || currentWorkflow.infra_agent?.terminal_command;
    if (cmd) {
      navigator.clipboard.writeText(cmd);
      setCopiedCommand(true);
      setTimeout(() => setCopiedCommand(false), 2000);
    }
  };

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
        resolved_at: data.resolved_at || new Date().toISOString(),
        action_taken: data.action_taken || (isInfra ? "infra_command" : "pull_request"),
        pr_url: data.pr_url || null,
        pr_number: data.pr_number || null,
        pr_branch: data.pr_branch || null,
        executed_command: data.executed_command || action?.terminal_command || null,
        approved_at: data.approved_at || new Date().toISOString(),
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
            ? `Patch approved! GitHub PR #${data.pr_number || 1} created (Simulated).`
            : `Patch approved! GitHub Pull Request #${data.pr_number || 1} created.`,
          {
            description: `Target branch: ${data.pr_branch || "hotfix/auto-remediation"}`,
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
        rejected_at: data.rejected_at || new Date().toISOString(),
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

  const patchLines = (action?.patch_content || currentWorkflow.coder_agent?.patch_content || "").split("\n");
  const terminalCommand = action?.terminal_command || currentWorkflow.infra_agent?.terminal_command || "kubectl rollout restart deployment/service -n production";
  const targetEnv = action?.target_environment || currentWorkflow.infra_agent?.target_environment || "production";
  const estimatedImpact = action?.estimated_impact || currentWorkflow.infra_agent?.estimated_impact || "Graceful rolling restart with zero downtime.";

  return (
    <div className="space-y-4">
      {/* ============================================================= */}
      {/* 1. TOP CENTER: MAIN AI (Google Gemini Orchestrator)           */}
      {/* Minimalist, Clean, Airy - NO visual clutter                   */}
      {/* ============================================================= */}
      <div className="max-w-2xl mx-auto w-full">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                <GeminiIcon className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Main Orchestrator AI
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Gemini Core
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                {Math.round((currentWorkflow.triage_agent.anomaly_confidence || 0.98) * 100)}% Confidence
              </span>
            </div>
          </div>

          {/* Diagnosis Paragraph */}
          <div className="py-3">
            <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
              {currentWorkflow.triage_agent.root_cause}
            </p>
          </div>

          {/* Bottom Strip: Metadata & Routing (Clean & Compact) */}
          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Squad:</span>
              <span className="font-semibold text-slate-800">{currentWorkflow.ops_agent.assigned_team}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-400">Priority:</span>
              <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                currentWorkflow.ops_agent.priority_level.startsWith("P0")
                  ? "bg-rose-50 text-rose-700 border border-rose-100"
                  : "bg-amber-50 text-amber-700 border border-amber-100"
              }`}>
                {currentWorkflow.ops_agent.priority_level}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Routing:</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[11px] border flex items-center gap-1 ${
                isInfra 
                  ? "bg-amber-50 text-amber-800 border-amber-200" 
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}>
                <span>Delegated to {isInfra ? "Infra AI" : "Coder AI"}</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Minimal Branching Tree Connector */}
        <div className="flex flex-col items-center justify-center my-1.5 select-none">
          <div className="w-0.5 h-3 bg-slate-300" />
          <div className="w-full max-w-sm h-0.5 bg-slate-300" />
          <div className="w-full max-w-sm flex justify-between">
            <div className="w-0.5 h-3 bg-slate-300" />
            <div className="w-0.5 h-3 bg-slate-300" />
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 2. RIGHT & LEFT: THE TWO WORKER STEPS                          */}
      {/* "uske niche right aur left me baaki do step lekin main ai     */}
      {/* kaam lene ke baad sirf ek ai ko hi kaam dega"                 */}
      {/* ============================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        
        {/* ----------------------------------------------------------- */}
        {/* LEFT WORKER: CODER AI (Code Bugs / Pull Request)            */}
        {/* ----------------------------------------------------------- */}
        <div className={`rounded-2xl border transition-all p-5 flex flex-col justify-between min-h-[360px] ${
          !isInfra
            ? "border-emerald-500 bg-white shadow-sm ring-2 ring-emerald-50"
            : "border-slate-200 bg-slate-50/50 border-dashed opacity-50"
        }`}>
          <div>
            {/* Worker Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  !isInfra ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400"
                }`}>
                  <FileCode2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Coder AI
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Source Patch & GitHub PR</span>
                </div>
              </div>

              {!isInfra ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Assigned</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-600 flex items-center gap-1">
                  <Ban className="w-3 h-3" />
                  <span>Bypassed</span>
                </span>
              )}
            </div>

            {/* Worker Content */}
            {!isInfra ? (
              <div className="mt-3 space-y-3">
                <div className="p-2 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                  <div className="truncate">
                    <span className="text-slate-500 font-medium">File: </span>
                    <strong className="font-mono text-emerald-900 font-bold underline">
                      {action?.file_path || currentWorkflow.coder_agent?.file_path || "src/handler.ts"}
                    </strong>
                  </div>
                  <button
                    onClick={handleCopyDiff}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 shrink-0"
                  >
                    {copiedDiff ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDiff ? "Copied" : "Copy Diff"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400">Branch:</span>
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-mono text-[11px]">
                    {action?.branch_name || currentWorkflow.coder_agent?.branch_name || "hotfix/auto-remediation"}
                  </span>
                </div>

                {/* Git Diff View */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 font-mono text-xs overflow-x-auto space-y-0.5 max-h-[150px] overflow-y-auto">
                  {patchLines.map((line, idx) => {
                    const isAdd = line.startsWith("+");
                    const isDel = line.startsWith("-");

                    return (
                      <div
                        key={idx}
                        className={`px-1.5 py-0.5 rounded ${
                          isAdd
                            ? "bg-emerald-100 text-emerald-800 font-semibold"
                            : isDel
                            ? "bg-rose-100 text-rose-800 font-semibold"
                            : "text-slate-600"
                        }`}
                      >
                        {line || " "}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Inactive Message */
              <div className="mt-8 text-center p-4 space-y-1">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Ban className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-700">No Code Patch Needed</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Evaluated as an infrastructure saturation issue. Coder AI is on standby.
                </p>
              </div>
            )}
          </div>

          {/* Action Footer for Coder AI */}
          {!isInfra && (
            <div className="pt-3 mt-3 border-t border-slate-100">
              {currentIncident.status === "pending" ? (
                <div className="flex items-center justify-between gap-2.5">
                  <button
                    onClick={handleReject}
                    disabled={isRejecting || isApproving}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
                  >
                    {isRejecting ? "Dismissing..." : "Dismiss"}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isApproving || isRejecting}
                    className="flex-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Opening GitHub PR...</span>
                      </>
                    ) : (
                      <>
                        <GitPullRequest className="w-3.5 h-3.5" />
                        <span>Approve & Open GitHub PR</span>
                      </>
                    )}
                  </button>
                </div>
              ) : currentIncident.status === "approved" ? (
                currentIncident.pr_url ? (
                  <a
                    href={currentIncident.pr_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <GitPullRequest className="w-3.5 h-3.5" />
                    <span>View Pull Request #{currentIncident.pr_number || "Open"} on GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-emerald-50 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>PR Created on GitHub</span>
                  </div>
                )
              ) : (
                <div className="text-center text-xs text-slate-400 p-1.5">Incident Dismissed</div>
              )}
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------- */}
        {/* RIGHT WORKER: INFRA AI (Server / Terminal Command)          */}
        {/* ----------------------------------------------------------- */}
        <div className={`rounded-2xl border transition-all p-5 flex flex-col justify-between min-h-[360px] ${
          isInfra
            ? "border-amber-500 bg-white shadow-sm ring-2 ring-amber-50"
            : "border-slate-200 bg-slate-50/50 border-dashed opacity-50"
        }`}>
          <div>
            {/* Worker Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isInfra ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-400"
                }`}>
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Infra AI
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Server & Database Operations</span>
                </div>
              </div>

              {isInfra ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-amber-600" />
                  <span>Assigned</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-600 flex items-center gap-1">
                  <Ban className="w-3 h-3" />
                  <span>Bypassed</span>
                </span>
              )}
            </div>

            {/* Worker Content */}
            {isInfra ? (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Target Env
                    </span>
                    <span className="text-xs font-bold text-slate-900 font-mono px-1.5 py-0.5 bg-white rounded border border-slate-200 inline-block">
                      {targetEnv}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Impact
                    </span>
                    <span className="text-[11px] font-medium text-slate-700 line-clamp-1" title={estimatedImpact}>
                      {estimatedImpact}
                    </span>
                  </div>
                </div>

                {/* Shell Command Box */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-semibold text-slate-700 flex items-center gap-1 text-[11px]">
                      <Terminal className="w-3 h-3 text-amber-600" />
                      <span>Shell Command</span>
                    </span>
                    <button
                      onClick={handleCopyCommand}
                      className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {copiedCommand ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCommand ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 font-mono text-xs text-emerald-400 shadow-inner overflow-x-auto flex items-center gap-2">
                    <span className="text-slate-500 select-none font-bold">$</span>
                    <code className="text-emerald-300 font-semibold flex-1 break-all">
                      {terminalCommand}
                    </code>
                  </div>
                </div>
              </div>
            ) : (
              /* Inactive Message */
              <div className="mt-8 text-center p-4 space-y-1">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Ban className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-700">No Server Command Needed</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Evaluated as a source code bug. Infra AI is on standby.
                </p>
              </div>
            )}
          </div>

          {/* Action Footer for Infra AI */}
          {isInfra && (
            <div className="pt-3 mt-3 border-t border-slate-100">
              {currentIncident.status === "pending" ? (
                <div className="flex items-center justify-between gap-2.5">
                  <button
                    onClick={handleReject}
                    disabled={isRejecting || isApproving}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
                  >
                    {isRejecting ? "Dismissing..." : "Dismiss"}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isApproving || isRejecting}
                    className="flex-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Executing Command...</span>
                      </>
                    ) : (
                      <>
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Approve & Execute Command</span>
                      </>
                    )}
                  </button>
                </div>
              ) : currentIncident.status === "approved" ? (
                <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-emerald-50 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Command Executed (Exit Code 0) • Target Host Restored</span>
                </div>
              ) : (
                <div className="text-center text-xs text-slate-400 p-1.5">Incident Dismissed</div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
