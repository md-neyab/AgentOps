"use client";

import { useState } from "react";
import { 
  AIAnalysis, 
  SuggestedAction, 
  MultiAgentWorkflow 
} from "@/lib/types";
import { 
  Users, 
  FileCode2, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  GitBranch, 
  Clock, 
  Hash, 
  Bot,
  Terminal,
  Server,
  Layers,
  Sparkles,
  Zap
} from "lucide-react";

interface MultiAgentStepperProps {
  analysis: AIAnalysis | null;
  suggestedAction: SuggestedAction | null;
  workflow?: MultiAgentWorkflow | null;
}

export function MultiAgentStepper({
  analysis,
  suggestedAction,
  workflow,
}: MultiAgentStepperProps) {
  const [copiedDiff, setCopiedDiff] = useState(false);
  const [copiedJira, setCopiedJira] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);

  const action = suggestedAction || analysis?.suggested_action;

  // Detect whether this incident is Situation A (Code) or Situation B (Infra)
  const isInfra = 
    action?.category === "infra" || 
    action?.action_type === "infra_command" ||
    workflow?.ops_agent?.routing_decision === "infra_agent" ||
    Boolean(action?.terminal_command);

  // Fallback workflow object if not present
  const currentWorkflow: MultiAgentWorkflow = workflow || analysis?.multi_agent_workflow || {
    triage_agent: {
      agent_name: "Agent Alpha (Triage & Alert)",
      severity: analysis?.severity || "high",
      root_cause: analysis?.root_cause || "Anomaly detected in execution pipeline.",
      needs_senior_escalation: analysis?.severity === "critical",
      simulated_slack_alert_text: `🚨 [${(analysis?.severity || "high").toUpperCase()}] Issue detected in production service.`,
      anomaly_confidence: analysis?.confidence_score || 0.96,
    },
    ops_agent: {
      agent_name: "Agent Beta (Manager AI & Ops Coordinator)",
      assigned_team: isInfra ? "Cloud Infrastructure & Database SRE" : "Platform Core / SRE Squad",
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
    orchestrated_at: new Date().toISOString(),
    total_duration_ms: 1140,
  };

  const handleCopyDiff = () => {
    const diff = action?.patch_content || currentWorkflow.coder_agent?.patch_content;
    if (diff) {
      navigator.clipboard.writeText(diff);
      setCopiedDiff(true);
      setTimeout(() => setCopiedDiff(false), 2000);
    }
  };

  const handleCopyJira = () => {
    navigator.clipboard.writeText(currentWorkflow.ops_agent.jira_ticket_title);
    setCopiedJira(true);
    setTimeout(() => setCopiedJira(false), 2000);
  };

  const handleCopyCommand = () => {
    const cmd = action?.terminal_command || currentWorkflow.infra_agent?.terminal_command;
    if (cmd) {
      navigator.clipboard.writeText(cmd);
      setCopiedCommand(true);
      setTimeout(() => setCopiedCommand(false), 2000);
    }
  };

  const patchLines = (action?.patch_content || currentWorkflow.coder_agent?.patch_content || "").split("\n");
  const terminalCommand = action?.terminal_command || currentWorkflow.infra_agent?.terminal_command || "kubectl rollout restart deployment/service -n production";
  const targetEnv = action?.target_environment || currentWorkflow.infra_agent?.target_environment || "production";
  const estimatedImpact = action?.estimated_impact || currentWorkflow.infra_agent?.estimated_impact || "Graceful rolling restart with zero downtime.";

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
      {/* Orchestration Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Manager-Worker AI Pipeline
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                isInfra ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-700"
              }`}>
                {isInfra ? "State B: Infra AI" : "State A: Coder AI"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Manager AI analyzes incident & dynamically routes to specialized worker
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>{currentWorkflow.total_duration_ms}ms runtime</span>
        </div>
      </div>

      {/* Vertical Stepper Container */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        
        {/* ================================================================= */}
        {/* STEP 1: Agent Alpha (Triage & Alert Agent)                        */}
        {/* ================================================================= */}
        <div className="relative flex items-start gap-4">
          <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-slate-200 -mb-6" />

          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md shadow-blue-500/20 z-10">
            1
          </div>

          <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Agent Alpha
                </span>
                <span className="text-xs text-slate-500 font-medium">• Triage & Anomaly Assessment</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Triaged
              </span>
            </div>

            <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {currentWorkflow.triage_agent.root_cause}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                Confidence: {Math.round(currentWorkflow.triage_agent.anomaly_confidence * 100)}%
              </span>

              {currentWorkflow.triage_agent.needs_senior_escalation ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[11px]">
                  <AlertTriangle className="w-3 h-3" /> Senior Escalation Triggered
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold text-[11px]">
                  Standard Auto-Triage
                </span>
              )}
            </div>

            {/* Slack Alert Simulation */}
            <div className="rounded-xl border border-slate-200 bg-[#4A154B]/5 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#4A154B] font-bold">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3 h-3" /> simulated-slack-alert • #production-ops
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Instant Dispatch</span>
              </div>
              <div className="text-xs text-slate-800 font-sans pl-2 border-l-2 border-[#4A154B]">
                {currentWorkflow.triage_agent.simulated_slack_alert_text}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* STEP 2: Agent Beta (Manager AI & Ops Coordinator)                 */}
        {/* ================================================================= */}
        <div className="relative flex items-start gap-4">
          <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-slate-200 -mb-6" />

          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md shadow-indigo-500/20 z-10">
            2
          </div>

          <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Agent Beta (Manager AI)
                </span>
                <span className="text-xs text-slate-500 font-medium">• Dynamic Routing Decision</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                <Users className="w-3 h-3" /> Routed
              </span>
            </div>

            {/* Dynamic Routing Notification Card */}
            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                {isInfra ? <Server className="w-4 h-4" /> : <FileCode2 className="w-4 h-4" />}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-900">
                    Routing Decision: {isInfra ? "Infra AI (Server/Config Issue)" : "Coder AI (Code Patch Issue)"}
                  </span>
                </div>
                <p className="text-xs text-indigo-800/80">
                  {currentWorkflow.ops_agent.routing_reason}
                </p>
              </div>
            </div>

            {/* Jira Card */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                    Jira Issue
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {currentWorkflow.ops_agent.jira_ticket_title}
                  </span>
                </div>
                <button
                  onClick={handleCopyJira}
                  className="text-slate-400 hover:text-slate-600 p-1"
                  title="Copy Ticket Title"
                >
                  {copiedJira ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="text-slate-400">Squad:</span>
                  <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {currentWorkflow.ops_agent.assigned_team}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Priority:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-md ${
                      currentWorkflow.ops_agent.priority_level.startsWith("P0")
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {currentWorkflow.ops_agent.priority_level}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="text-slate-400">SLA:</span>
                  <span className="font-semibold text-slate-800">
                    {currentWorkflow.ops_agent.sla_target}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* STEP 3: WORKER AI EXECUTION                                      */}
        {/* STATE A: Coder AI (Code Diff) OR STATE B: Infra AI (Terminal Cmd) */}
        {/* ================================================================= */}
        <div className="relative flex items-start gap-4">
          <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md z-10 ${
            isInfra ? "bg-amber-600 shadow-amber-500/20" : "bg-emerald-600 shadow-emerald-500/20"
          }`}>
            3
          </div>

          <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  {isInfra ? "Infra AI" : "Coder AI"}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {isInfra ? "• Server & Infrastructure Remediation" : "• Autonomous Code Patch Synthesis"}
                </span>
              </div>
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                isInfra 
                  ? "text-amber-800 bg-amber-50 border-amber-200"
                  : "text-emerald-700 bg-emerald-50 border-emerald-200"
              }`}>
                {isInfra ? <Terminal className="w-3 h-3" /> : <FileCode2 className="w-3 h-3" />}
                {isInfra ? "Command Ready" : "Patch Ready"}
              </span>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* STATE B: INFRA AI VIEW (Terminal Command Block)             */}
            {/* ----------------------------------------------------------- */}
            {isInfra ? (
              <div className="space-y-3">
                {/* Labels: Target Environment & Estimated Impact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Target Environment
                    </span>
                    <span className="text-xs font-bold text-slate-900 font-mono px-2 py-0.5 bg-white rounded border border-slate-200 inline-block">
                      {targetEnv}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Estimated Impact
                    </span>
                    <span className="text-xs font-medium text-slate-700 block">
                      {estimatedImpact}
                    </span>
                  </div>
                </div>

                {/* Sleek Terminal Command Block */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-amber-600" />
                      Remediation CLI Command
                    </span>
                    <button
                      onClick={handleCopyCommand}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {copiedCommand ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Command</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-900 overflow-x-auto shadow-inner flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 select-none font-bold">$</span>
                      <code className="text-slate-900 font-semibold">{terminalCommand}</code>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* --------------------------------------------------------- */
              /* STATE A: CODER AI VIEW (Standard Git-style Diff View)     */
              /* --------------------------------------------------------- */
              <div className="space-y-3">
                {/* Explicit Label: "Coder AI generated a patch for file: [filename]" */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <FileCode2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-emerald-950 font-medium">
                      Coder AI generated a patch for file:{" "}
                      <strong className="font-mono font-bold text-emerald-900 underline underline-offset-2">
                        {action?.file_path || currentWorkflow.coder_agent?.file_path}
                      </strong>
                    </span>
                  </div>

                  <button
                    onClick={handleCopyDiff}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 shrink-0 ml-auto"
                  >
                    {copiedDiff ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Patch</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Branch Info */}
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400">Target Branch:</span>
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {action?.branch_name || currentWorkflow.coder_agent?.branch_name}
                  </span>
                </div>

                {/* Git-Style Diff Viewer with red/green lines */}
                <div className="rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-3.5 font-mono text-xs overflow-x-auto space-y-0.5 shadow-inner">
                  {patchLines.map((line, idx) => {
                    const isAdd = line.startsWith("+");
                    const isDel = line.startsWith("-");

                    return (
                      <div
                        key={idx}
                        className={`px-2 py-0.5 rounded ${
                          isAdd
                            ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                            : isDel
                            ? "bg-rose-500/20 text-rose-300 font-semibold"
                            : "text-slate-300"
                        }`}
                      >
                        {line || " "}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
