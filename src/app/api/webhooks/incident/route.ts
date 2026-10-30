import { NextRequest, NextResponse } from "next/server";
import { orchestrateMultiAgentPipeline } from "@/lib/groq";
import { isServerSupabaseConfigured, supabaseAdmin, getMockStore } from "@/lib/supabase/server";
import { Incident } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { raw_log, service = "default-service", environment = "production" } = body;

    if (!raw_log || typeof raw_log !== "string") {
      return NextResponse.json(
        { error: "Invalid payload: 'raw_log' string is required." },
        { status: 400 }
      );
    }

    // 1. Run 3-Agent Groq Orchestration Pipeline
    const { aiAnalysis, workflow } = await orchestrateMultiAgentPipeline(raw_log, service, environment);

    // 2. Prepare Incident Record
    const incidentData: Partial<Incident> = {
      title: aiAnalysis.title,
      service_name: service,
      environment,
      raw_log,
      severity: aiAnalysis.severity,
      status: "pending",
      ai_analysis: aiAnalysis,
      suggested_action: aiAnalysis.suggested_action,
      multi_agent_workflow: workflow,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 3. Persist to Supabase if configured, otherwise persist to mock store
    let incidentId: string;

    if (isServerSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from("incidents")
        .insert([incidentData])
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        // Fallback to memory store if DB insert fails
        const newIncident: Incident = {
          id: crypto.randomUUID(),
          ...incidentData,
        } as Incident;
        getMockStore().unshift(newIncident);
        incidentId = newIncident.id;
      } else {
        incidentId = data.id;
      }
    } else {
      const newIncident: Incident = {
        id: crypto.randomUUID(),
        ...incidentData,
      } as Incident;
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
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal Server Error processing incident telemetry." },
      { status: 500 }
    );
  }
}

