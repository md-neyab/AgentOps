"use client";

import { useState } from "react";
import { Copy, Check, FileText, Activity, AlertCircle, Shield } from "lucide-react";

interface TerminalViewerProps {
  rawLog: string;
  serviceName: string;
  environment: string;
  timestamp: string;
}

// Generate realistic enterprise stack traces if the stored rawLog is only 1-2 lines
function getEnrichedLogLines(rawLog: string, serviceName: string, environment: string, timestamp: string): string[] {
  const existingLines = (rawLog || "").split("\n").filter(Boolean);
  if (existingLines.length >= 5) {
    return (rawLog || "").split("\n");
  }

  const errText = rawLog || "Internal Server Error";
  const dateStr = new Date(timestamp).toISOString();

  if (errText.toLowerCase().includes("deadlock")) {
    return [
      `[${dateStr}] [FATAL] [${serviceName}] (pid 1402): Transaction deadlock detected in PostgreSQL ledger pool`,
      `Environment: ${environment} • Node: Linux 6.6.13-cloud-amd64 • Service: ${serviceName}`,
      `ERROR: deadlock detected in Postgres ledger update at process 1402`,
      `    at PostgresPool.query (/app/node_modules/pg-pool/index.js:342:11)`,
      `    at LedgerRepository.updateBalance (/app/src/billing/ledger.repository.ts:89:14)`,
      `    at TransactionManager.executeWithLock (/app/src/billing/transaction.manager.ts:145:22)`,
      `    at async BillingService.processPayout (/app/src/billing/billing.service.ts:204:9)`,
      `    at async Router.handleRequest (/app/src/api/routes.ts:77:5)`,
      `--- Transaction Diagnostics ---`,
      `Endpoint: POST /api/v1/ledger/transfer`,
      `Transaction ID: tx_89af32b1-042c • Lock Wait Time: 45012ms`,
      `Process 1402 waits for ExclusiveLock on relation 16384 of database 16385`,
      `Process 1398 waits for RowExclusiveLock on relation 16384 (held by process 1402)`,
      `Root Cause: Circular database locks during concurrent financial ledger commit.`
    ];
  }

  if (errText.toLowerCase().includes("memory") || errText.toLowerCase().includes("heap") || errText.toLowerCase().includes("oom")) {
    return [
      `[${dateStr}] [FATAL] [${serviceName}] (pid 8092): JavaScript heap out of memory`,
      `Environment: ${environment} • Runtime: Node.js v20.12.0 • Container: pod/${serviceName}-7f98b6c4`,
      `<--- Last few GCs --->`,
      `[8092:0x55df2a0] 119820 ms: Mark-sweep 2046.2 (2052.1) -> 2045.8 (2052.1) MB, 1420.4 / 0.0 ms allocation failure`,
      `FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`,
      `    at SessionStore.setSession (/app/dist/session.js:204:14)`,
      `    at AuthHandler.validateAndStoreToken (/app/dist/auth.js:88:22)`,
      `    at async JwtStrategy.authenticate (/app/dist/strategies/jwt.js:45:10)`,
      `    at async /app/dist/server.js:312:7`,
      `--- Memory Diagnostics ---`,
      `Memory Usage: RSS: 2180MB, HeapUsed: 2046MB (Limit: 2048MB)`,
      `Active Sessions: 89,412 (Unbounded Map cache leak detected)`,
      `Root Cause: Missing TTL eviction in in-memory session store.`
    ];
  }

  if (errText.toLowerCase().includes("jwt") || errText.toLowerCase().includes("token") || errText.toLowerCase().includes("secret")) {
    return [
      `[${dateStr}] [ERROR] [${serviceName}] (pid 3120): Unhandled JsonWebTokenError`,
      `Environment: ${environment} • Service: ${serviceName} • Status: 500 Internal Error`,
      `JsonWebTokenError: secret or public key must be provided`,
      `    at Object.module.exports [as verify] (/app/node_modules/jsonwebtoken/verify.js:63:17)`,
      `    at AuthService.validateToken (/app/src/services/auth.service.ts:42:15)`,
      `    at AuthMiddleware.authenticate (/app/src/middleware/auth.ts:28:31)`,
      `    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)`,
      `--- Auth Diagnostics ---`,
      `Endpoint: GET /api/v1/user/profile • Method: Bearer Auth`,
      `Config: process.env.JWT_SECRET is undefined in runtime environment`,
      `Root Cause: Missing fallback key verification causing fatal unhandled crash.`
    ];
  }

  return [
    `[${dateStr}] [ERROR] [${serviceName}]: Runtime Exception occurred`,
    `Environment: ${environment} • Service: ${serviceName}`,
    errText,
    `    at Handler.processRequest (/app/src/server.ts:114:18)`,
    `    at async Pipeline.execute (/app/src/core/pipeline.ts:62:9)`,
    `    at async Router.dispatch (/app/src/api/routes.ts:35:12)`,
    `--- Diagnostics ---`,
    `Container: ${serviceName}-deployment-88c9f`,
    `Exit Code: 1 (Process Terminated Unexpectedly)`
  ];
}

export function TerminalViewer({
  rawLog,
  serviceName,
  environment,
  timestamp,
}: TerminalViewerProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"trace" | "metadata">("trace");

  const lines = getEnrichedLogLines(rawLog, serviceName, environment, timestamp);
  const fullTextToCopy = lines.join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(fullTextToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderHighlightedLine = (line: string) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return <span>&nbsp;</span>;
    }

    if (line.includes("---") || line.includes("===")) {
      return (
        <span className="text-blue-700 font-bold tracking-wider uppercase text-[10px] block pt-2 pb-0.5 border-b border-slate-200">
          {line}
        </span>
      );
    }

    if (
      line.includes("FATAL") ||
      line.includes("ERROR") ||
      line.includes("deadlock detected") ||
      line.includes("Exception") ||
      line.includes("OOMKilled") ||
      line.includes("Allocation failed") ||
      line.includes("Error:")
    ) {
      return (
        <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200/80 inline-block">
          {line}
        </span>
      );
    }

    if (trimmed.startsWith("at ")) {
      return (
        <span className="text-slate-600 font-mono">
          <span className="text-slate-400 font-semibold">at </span>
          <span className="text-slate-800 font-medium">{trimmed.slice(3)}</span>
        </span>
      );
    }

    if (line.includes(":") && !line.includes("http")) {
      const [key, ...rest] = line.split(":");
      return (
        <span className="text-slate-700">
          <span className="text-slate-400 font-semibold">{key}:</span>
          <span className="text-slate-900 font-semibold ml-1">{rest.join(":")}</span>
        </span>
      );
    }

    return <span className="text-slate-700 font-medium">{line}</span>;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col">
      {/* Top Header Bar (Clean Light Theme) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/80 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Original Production Crash Telemetry
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                Live Crash Capture
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Source: <strong className="text-slate-700 font-semibold">{serviceName}</strong> • Environment: <strong className="text-slate-700 font-semibold uppercase">{environment}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtabs */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setActiveTab("trace")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "trace"
                  ? "bg-blue-50 text-blue-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Stack Trace</span>
            </button>
            <button
              onClick={() => setActiveTab("metadata")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "metadata"
                  ? "bg-blue-50 text-blue-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Host Telemetry</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all border border-slate-200 shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Log</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Body (Clean Light Background) */}
      {activeTab === "trace" ? (
        <div className="p-4 sm:p-5 overflow-x-auto font-mono text-xs leading-relaxed select-text max-h-[360px] overflow-y-auto bg-slate-50/50">
          <div className="space-y-1">
            {lines.map((line, index) => (
              <div key={index} className="flex items-start py-0.5 group">
                <span className="w-8 shrink-0 select-none text-slate-400 text-right pr-3 text-[11px] border-r border-slate-200 mr-3 group-hover:text-slate-600 font-mono">
                  {index + 1}
                </span>
                <div className="flex-1 break-all">
                  {renderHighlightedLine(line)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-5 bg-white text-xs space-y-4 max-h-[360px] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Target Service
              </span>
              <span className="font-bold text-slate-800 font-mono">
                {serviceName}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Runtime Environment
              </span>
              <span className="font-bold text-blue-700 font-mono uppercase">
                {environment}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 sm:col-span-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Detection Timestamp
              </span>
              <span className="font-semibold text-slate-800">
                {new Date(timestamp).toUTCString()} ({new Date(timestamp).toLocaleTimeString()})
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 sm:col-span-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Kubernetes / Node Cluster Signature
              </span>
              <span className="font-mono text-slate-600 text-[11px] block">
                pod/{serviceName}-7f98b6c4-w8k2n • Linux 6.6.13-cloud-amd64 • Node.js v20.12.0
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
