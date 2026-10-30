"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Send, 
  Copy, 
  Check, 
  Sparkles, 
  Database, 
  Cpu, 
  Flame, 
  Key, 
  Loader2, 
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  Bot
} from "lucide-react";

interface PresetIncident {
  name: string;
  category: "Code Issue (Coder AI)" | "Infra Issue (Infra AI)";
  service: string;
  environment: string;
  icon: typeof Flame;
  log: string;
}

const PRESETS: PresetIncident[] = [
  {
    name: "Out of Memory (OOM)",
    category: "Code Issue (Coder AI)",
    service: "auth-service",
    environment: "production",
    icon: Cpu,
    log: `2026-10-30T22:14:02.194Z [FATAL] auth-service (node:v20.11.1-alpine) env:production
Error: JavaScript heap out of memory (Allocation failed - process reached 2048 MB memory ceiling)
  at SessionStore.setSession (/app/dist/auth/session.js:204:14)
  at async AuthController.authenticateToken (/app/dist/auth/controller.js:89:22)
  at async Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
  at async Route.dispatch (/app/node_modules/express/lib/router/route.js:112:3)
  at async processTicksAndRejections (node:internal/process/task_queues:95:5)

--- Context & Request Metadata ---
correlation_id: req_982bf7a01e
user_id: usr_99410a82
ip_address: 198.51.100.44
endpoint: POST /api/v2/auth/sessions/refresh
headers: { "host": "auth.internal.production", "x-request-id": "req_982bf7a01e" }
memory_usage: { rss: "2147483648", heapTotal: "2097152000", heapUsed: "2096894016" }`,
  },
  {
    name: "Redis Server Saturated",
    category: "Infra Issue (Infra AI)",
    service: "cache-layer",
    environment: "production",
    icon: Flame,
    log: `2026-10-30T22:14:02.194Z [ERROR] cache-layer (ioredis:v5.3.2, node:v20.11.1) env:production
ClusterConnectionError: Max clients reached (10000/10000 connection pool ceiling saturated)
  at RedisCluster.handleError (/app/node_modules/ioredis/built/cluster/index.js:321:18)
  at Socket.<anonymous> (/app/node_modules/ioredis/built/redis/index.js:342:21)
  at Socket.emit (node:events:517:28)
  at TCP.onStreamRead (node:internal/js_stream_socket:209:12)

--- Context & Socket Telemetry ---
active_sockets: 10000
rejected_connections_1m: 1420
target_cluster: redis-cluster-primary.cache.production.svc.cluster.local:6379
keepalive_timeout_ms: 30000
command_buffer_len: 8941`,
  },
  {
    name: "Database Deadlock",
    category: "Infra Issue (Infra AI)",
    service: "billing-service",
    environment: "production",
    icon: Database,
    log: `2026-10-30T22:14:02.194Z [ERROR] billing-service (postgres:v15.4-alpine, node:v20.11.1) env:production
PostgreSQLError: deadlock detected at transaction lock resolution
DETAIL: Process 1402 waits for ExclusiveLock on relation 49219 (table "ledger_entries"); blocked by Process 1403.
Process 1403 waits for ExclusiveLock on relation 49218 (table "account_balances"); blocked by Process 1402.
HINT: See server log for query details.
  at PostgresPool.query (/app/dist/db/postgres.js:142:11)
  at async LedgerRepository.transferFunds (/app/dist/ledger/repository.js:88:19)
  at async SettlementWorker.processQueueItem (/app/dist/workers/settlement.js:210:9)
  at async QueueConsumer.dispatch (/app/node_modules/bullmq/dist/classes/worker.js:145:21)

--- Context & Request Metadata ---
transaction_id: tx_01h8e9f2a014
lock_mode: ExclusiveLock (tuple 14/82)
duration_ms: 15420
statement: UPDATE account_balances SET balance = balance - $1 WHERE id = $2 RETURNING *`,
  },
  {
    name: "Missing Token Secret",
    category: "Code Issue (Coder AI)",
    service: "api-gateway",
    environment: "production",
    icon: Key,
    log: `2026-10-30T22:14:02.194Z [ERROR] api-gateway (node:v20.11.1, express:v4.19.2) env:production
TypeError: Cannot read properties of undefined (reading 'sign') at generateToken
  at generateToken (/app/dist/auth/jwt.js:44:26)
  at AuthMiddleware.verifyAndSign (/app/dist/middleware/auth.js:81:18)
  at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
  at trim_prefix (/app/node_modules/express/lib/router/index.js:328:13)
  at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)

--- Context & Request Metadata ---
correlation_id: req_38f01b92c4
missing_env_key: JWT_SIGNING_PRIVATE_KEY
route: /v1/tokens/exchange
method: POST
status_code: 500`,
  },
];

export function WebhookTester() {
  const router = useRouter();
  const [service, setService] = useState("auth-service");
  const [environment, setEnvironment] = useState("production");
  const [rawLog, setRawLog] = useState(
    "FATAL ERROR: JavaScript heap out of memory at SessionStore.setSession (/app/dist/session.js:204:14)"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [autoRedirect, setAutoRedirect] = useState(true);
  const [latestSuccess, setLatestSuccess] = useState<{
    id: string;
    summary: string;
    decision: string;
  } | null>(null);

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/incident`
      : "http://localhost:3000/api/webhooks/incident";

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSelectPreset = (preset: PresetIncident) => {
    setService(preset.service);
    setEnvironment(preset.environment);
    setRawLog(preset.log);
    toast.info(`Selected: ${preset.name}`);
  };

  const handleTriggerWebhook = async () => {
    if (!rawLog.trim()) {
      toast.error("Please enter an error log.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/webhooks/incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service,
          environment,
          raw_log: rawLog,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        const errorMsg = errData?.message || errData?.error || "Trigger failed";
        throw new Error(errorMsg);
      }

      const data = await res.json();
      setLatestSuccess({
        id: data.incident_id,
        summary: data.ai_summary || "Triaged by Multi-Agent Pipeline",
        decision: data.workflow?.routing_decision === "infra_agent" ? "Infra AI" : "Coder AI",
      });

      toast.success("Incident sent & triaged!", {
        description: `Routed to ${data.workflow?.routing_decision === "infra_agent" ? "Infra AI" : "Coder AI"}`,
        duration: 5000,
      });

      if (autoRedirect) {
        setTimeout(() => {
          router.push(`/incident/${data.incident_id}`);
        }, 800);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to trigger incident.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Prominent Success Notification Banner */}
      {latestSuccess && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-emerald-950">
                  Incident Triaged & Ready for Review!
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                  Routed to {latestSuccess.decision}
                </span>
              </div>
              <p className="text-xs text-emerald-800/80 font-medium mt-0.5 line-clamp-1">
                {latestSuccess.summary}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-emerald-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push(`/incident/${latestSuccess.id}`)}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Review Fix Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Webhook Endpoint Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Your Webhook URL</h3>
        <p className="text-xs text-slate-500 font-medium">
          Send error logs from any server to this address to trigger automatic AI analysis:
        </p>

        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <input
            readOnly
            value={webhookUrl}
            className="flex-1 bg-transparent font-mono text-xs text-slate-700 outline-none select-all"
          />
          <button
            onClick={handleCopyUrl}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1 shadow-sm"
          >
            {copiedUrl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy URL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Try a Demo Error (Click to fill)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="p-4 rounded-2xl bg-white hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 text-left transition-all shadow-sm flex items-center gap-3.5 group"
              >
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                      {preset.name}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      preset.category.includes("Infra") 
                        ? "bg-amber-100 text-amber-800" 
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {preset.category.includes("Infra") ? "Infra" : "Code"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {preset.service} • {preset.category}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulator Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Simulate Custom Error</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Service Name
            </label>
            <input
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Environment
            </label>
            <input
              type="text"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Error Message or Stack Trace
          </label>
          <textarea
            rows={4}
            value={rawLog}
            onChange={(e) => setRawLog(e.target.value)}
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Auto-redirect checkbox control */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="autoRedirect"
            checked={autoRedirect}
            onChange={(e) => setAutoRedirect(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="autoRedirect" className="text-xs font-medium text-slate-600 select-none cursor-pointer">
            Automatically open incident review page after sending
          </label>
        </div>

        <div className="flex items-center justify-between pt-2">
          {latestSuccess?.id ? (
            <button
              type="button"
              onClick={() => router.push(`/incident/${latestSuccess.id}`)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
            >
              <span>View Last Created Incident</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleTriggerWebhook}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Orchestrating 3 AI Agents...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Error to AI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
