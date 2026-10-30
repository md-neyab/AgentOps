import { NextRequest, NextResponse } from "next/server";
import { triageIncidentWithGroq } from "@/lib/groq";
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

    // 1. Run ultra-fast Groq Llama-3 AI triage
    const aiAnalysis = await triageIncidentWithGroq(raw_log, service, environment);

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
        message: "Incident successfully ingested and analyzed via Groq Llama-3.",
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

