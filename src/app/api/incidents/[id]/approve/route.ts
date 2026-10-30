import { NextRequest, NextResponse } from "next/server";
import { createGitHubPullRequest } from "@/lib/github";
import { isServerSupabaseConfigured, supabaseAdmin, getMockStore } from "@/lib/supabase/server";
import { Incident } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    let incident: Incident | null = null;

    if (isServerSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from("incidents")
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data) incident = data;
    }

    if (!incident) {
      incident = getMockStore().find((item) => item.id === id) || null;
    }

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const action = incident.suggested_action || incident.ai_analysis?.suggested_action;
    const isInfra = action?.category === "infra" || action?.action_type === "infra_command";
    const now = new Date().toISOString();

    // ------------------------------------------------------------------------
    // SITUATION B: Infra Issue -> Server Command Execution
    // ------------------------------------------------------------------------
    if (isInfra) {
      const command = action?.terminal_command || `kubectl rollout restart deployment/${incident.service_name} -n ${incident.environment}`;

      // Update Database Record
      if (isServerSupabaseConfigured()) {
        await supabaseAdmin
          .from("incidents")
          .update({
            status: "approved",
            executed_command: command,
            approved_at: now,
            updated_at: now,
          })
          .eq("id", id);
      }

      // Update Mock Store
      const store = getMockStore();
      const idx = store.findIndex((item) => item.id === id);
      if (idx !== -1) {
        store[idx] = {
          ...store[idx],
          status: "approved",
          executed_command: command,
          approved_at: now,
          updated_at: now,
        };
      }

      return NextResponse.json({
        success: true,
        status: "approved",
        action_type: "infra_command",
        category: "infra",
        executed_command: command,
        message: "Command executed on target server",
        approved_at: now,
      });
    }

    // ------------------------------------------------------------------------
    // SITUATION A: Code Issue -> GitHub Pull Request Automation
    // ------------------------------------------------------------------------
    const branchName = action?.branch_name || `hotfix/inc-${id.slice(0, 8)}`;
    const filePath = action?.file_path || "src/server.ts";
    const prTitle = action?.pr_title || `fix: resolve incident ${incident.title}`;
    const prBody = action?.pr_body || `Remediation for incident ${id}`;
    const patchContent = action?.patch_content || "// Applied fix";

    const prResult = await createGitHubPullRequest({
      branchName,
      filePath,
      prTitle,
      prBody,
      patchContent,
    });

    if (isServerSupabaseConfigured()) {
      await supabaseAdmin
        .from("incidents")
        .update({
          status: "approved",
          pr_url: prResult.pr_url,
          pr_number: prResult.pr_number,
          pr_branch: prResult.branch,
          approved_at: now,
          updated_at: now,
        })
        .eq("id", id);
    }

    const store = getMockStore();
    const idx = store.findIndex((item) => item.id === id);
    if (idx !== -1) {
      store[idx] = {
        ...store[idx],
        status: "approved",
        pr_url: prResult.pr_url,
        pr_number: prResult.pr_number,
        pr_branch: prResult.branch,
        approved_at: now,
        updated_at: now,
      };
    }

    return NextResponse.json({
      success: true,
      status: "approved",
      action_type: "pull_request",
      category: "code",
      pr_url: prResult.pr_url,
      pr_number: prResult.pr_number,
      pr_branch: prResult.branch,
      simulated: prResult.simulated,
      approved_at: now,
    });
  } catch (error) {
    console.error("Failed to approve incident:", error);
    return NextResponse.json(
      { error: "Failed to approve incident and trigger remediation." },
      { status: 500 }
    );
  }
}
