"use client";

import { useState } from "react";
import { Copy, Check, FileText } from "lucide-react";

interface TerminalViewerProps {
  rawLog: string;
  serviceName: string;
  environment: string;
  timestamp: string;
}

export function TerminalViewer({
  rawLog,
  serviceName,
  environment,
  timestamp,
}: TerminalViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawLog);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = rawLog.split("\n");

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Original Error Log</h3>
            <p className="text-xs text-slate-500 font-medium">
              From {serviceName} ({environment})
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Log</span>
            </>
          )}
        </button>
      </div>

      {/* Code Container */}
      <div className="flex-1 p-5 overflow-y-auto bg-slate-50/60 font-mono text-xs leading-relaxed text-slate-700 select-text">
        <div className="space-y-1">
          {lines.map((line, index) => {
            const isError =
              line.includes("ERROR") ||
              line.includes("FATAL") ||
              line.includes("Exception") ||
              line.includes("OOMKilled");

            return (
              <div key={index} className="flex items-start py-0.5">
                <span className="w-8 shrink-0 select-none text-slate-400 text-right pr-3 text-[11px]">
                  {index + 1}
                </span>
                <span
                  className={`${
                    isError
                      ? "text-rose-600 font-bold bg-rose-50 px-1 rounded"
                      : "text-slate-700"
                  }`}
                >
                  {line}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
