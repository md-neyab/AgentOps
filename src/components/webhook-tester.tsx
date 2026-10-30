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
  ExternalLink 
} from "lucide-react";

interface PresetIncident {
  name: string;
  service: string;
  environment: string;
  icon: typeof Flame;
  log: string;
}

const PRESETS: PresetIncident[] = [
  {
    name: "Out of Memory (OOM)",
    service: "auth-service",
    environment: "production",
    icon: Cpu,
    log: `FATAL ERROR: JavaScript heap out of memory at SessionStore.setSession (/app/dist/session.js:204:14)`,
  },
  {
    name: "Database Deadlock",
    service: "billing-service",
    environment: "production",
    icon: Database,
    log: `ERROR: deadlock detected in Postgres ledger update at process 1402`,
  },
  {
    name: "Redis Server Saturated",
    service: "cache-layer",
    environment: "production",
    icon: Flame,
    log: `Error: Max clients reached on Redis pool after 30000ms`,
  },
  {
    name: "Missing Token Secret",
    service: "api-gateway",
    environment: "production",
    icon: Key,
    log: `TypeError: Cannot read properties of undefined (reading 'sign') at generateToken`,
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
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

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
        throw new Error("Trigger failed");
      }

      const data = await res.json();
      setLastCreatedId(data.incident_id);

      toast.success("Incident sent and triaged!", {
        description: "AI created a fix ready for your review.",
        action: {
          label: "View Incident",
          onClick: () => router.push(`/incident/${data.incident_id}`),
        },
        duration: 6000,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to trigger incident.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
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
                <div>
                  <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {preset.name}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {preset.service}
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

        <div className="flex items-center justify-between pt-2">
          {lastCreatedId ? (
            <button
              type="button"
              onClick={() => router.push(`/incident/${lastCreatedId}`)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
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
                <span>Analyzing Error...</span>
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
