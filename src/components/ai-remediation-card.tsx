"use client";

import { useState } from "react";
import { AIAnalysis, SuggestedAction } from "@/lib/types";
import { Sparkles, Copy, Check, GitPullRequest, FileCode, CheckCircle2 } from "lucide-react";

interface AIRemediationCardProps {
  analysis: AIAnalysis | null;
  suggestedAction: SuggestedAction | null;
}

export function AIRemediationCard({
  analysis,
  suggestedAction,
}: AIRemediationCardProps) {
  const [copiedDiff, setCopiedDiff] = useState(false);
  const action = suggestedAction || analysis?.suggested_action;

  const handleCopyDiff = () => {
    if (action?.patch_content) {
      navigator.clipboard.writeText(action.patch_content);
      setCopiedDiff(true);
      setTimeout(() => setCopiedDiff(false), 2000);
    }
  };

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 rounded-2xl border border-slate-200 bg-white text-slate-400">
        <Sparkles className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <h4 className="text-sm font-bold text-slate-700">Analyzing Problem...</h4>
        <p className="text-xs text-slate-400 mt-1">Creating a recommended fix for you...</p>
      </div>
    );
  }

  const patchLines = (action?.patch_content || "").split("\n");

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Suggested Solution</h3>
            <p className="text-xs text-slate-500 font-medium">Automatic root cause & fix</p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Ready to apply
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {/* Simple Summary */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Summary
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {analysis.executive_summary}
          </p>
        </div>

        {/* Why it happened */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Why this happened
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {analysis.root_cause}
          </p>
        </div>

        {/* Code Diff */}
        {action && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <FileCode className="w-4 h-4 text-slate-400" />
                <span>File to update:</span>
                <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                  {action.file_path}
                </span>
              </div>

              <button
                onClick={handleCopyDiff}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                {copiedDiff ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Diff Viewer */}
            <div className="rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto space-y-0.5 shadow-inner">
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
  );
}
