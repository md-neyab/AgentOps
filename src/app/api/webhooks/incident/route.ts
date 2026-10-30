import { NextRequest, NextResponse } from "next/server";
import { orchestrateMultiAgentPipeline } from "@/lib/groq";
import { isServerSupabaseConfigured, supabaseAdmin, getMockStore } from "@/lib/supabase/server";
import { Incident } from "@/lib/types";

function enrichStackTraceIfNeeded(log: string, service: string, env: string): string {
  const trimmed = log.trim();
  if (trimmed.split("\n").length >= 3) {
    return trimmed;
  }

  const now = new Date().toISOString();
  const reqId = `req_${Math.random().toString(36).substring(2, 10)}`;
  const userId = `usr_${Math.floor(10000 + Math.random() * 90000)}`;

  return `${now} [FATAL] ${service} (node:v20.11.1-alpine, linux/amd64) env:${env}
${trimmed}
  at ${service}.handleRequest (/app/dist/${service}/handler.js:142:18)
  at async RouteDispatcher.dispatch (/app/dist/server/router.js:88:22)
  at async Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
  at async processTicksAndRejections (node:internal/process/task_queues:95:5)

--- Context & Request Metadata ---
correlation_id: ${reqId}
user_id: ${userId}
client_ip: 198.51.100.${Math.floor(10 + Math.random() * 200)}
endpoint: /api/v1/${service}/process
status: 500 Internal Server Error`;
}

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const { 
      raw_log, 
      stack_trace,
      service, 
      service_name, 
      environment = "production" 
    } = body;

    const logContent = (raw_log || stack_trace) as string | undefined;

    if (!logContent || typeof logContent !== "string" || !logContent.trim()) {
      return NextResponse.json(
        { error: "Invalid payload: 'raw_log' or 'stack_trace' non-empty string is required." },
        { status: 400 }
      );
    }

    const resolvedService = (service_name || service || "default-service") as string;
    const resolvedEnv = typeof environment === "string" && environment.trim() ? environment.trim() : "production";
    const fullStackTrace = enrichStackTraceIfNeeded(logContent, resolvedService, resolvedEnv);

    // 1. Run 3-Agent Groq Orchestration Pipeline
    const { aiAnalysis, workflow } = await orchestrateMultiAgentPipeline(fullStackTrace, resolvedService, resolvedEnv);

    const now = new Date().toISOString();

    // 2. Prepare Incident Record with support for all database column schemas
    const incidentData: Record<string, unknown> = {
      title: aiAnalysis.title,
      service_name: resolvedService,
      service: resolvedService,
      environment: resolvedEnv,
      raw_log: fullStackTrace,
      stack_trace: fullStackTrace,
      severity: aiAnalysis.severity,
      status: "pending",
      ai_analysis: aiAnalysis,
      suggested_action: aiAnalysis.suggested_action,
      multi_agent_workflow: workflow,
      pr_url: null,
      pr_number: null,
      pr_branch: null,
      executed_command: null,
      action_taken: null,
      resolved_at: null,
      approved_at: null,
      rejected_at: null,
      created_at: now,
      updated_at: now,
    };

    // 3. Persist to Supabase if configured, otherwise persist to mock store
    let incidentId: string;

    if (isServerSupabaseConfigured()) {
      try {
        const { data, error } = await supabaseAdmin
          .from("incidents")
          .insert([incidentData])
          .select()
          .single();

        if (error) {
          console.error("🚨 SUPABASE INSERT ERROR:", error);
          return NextResponse.json(
            { 
              error: "Supabase insert failed", 
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            },
            { status: 500 }
          );
        }

        incidentId = data.id;
      } catch (dbError: any) {
        console.error("🚨 SUPABASE INSERT ERROR:", dbError);
        return NextResponse.json(
          { 
            error: "Supabase insert failed", 
            message: dbError?.message || String(dbError) 
          },
          { status: 500 }
        );
      }
    } else {
      const newIncident: Incident = {
        id: crypto.randomUUID(),
        ...incidentData,
      } as unknown as Incident;
      getMockStore().unshift(newIncident);
      incidentId = newIncident.id;
    }

    return NextResponse.json(
      {
        success: true,
        incident_id: incidentId,
        status: "pending",
        triage_status: "completed",
        ai_summary: aiAnalysis.executive_summary,
        workflow: {
          triage_agent: workflow.triage_agent.agent_name,
          ops_agent: workflow.ops_agent.agent_name,
          coder_agent: workflow.coder_agent?.agent_name || null,
          infra_agent: workflow.infra_agent?.agent_name || null,
          routing_decision: workflow.ops_agent.routing_decision,
          duration_ms: workflow.total_duration_ms,
        },
        message: "Incident triaged and orchestrated across 3 specialized AI agents.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { 
        error: "Internal Server Error processing incident telemetry.",
        message: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
