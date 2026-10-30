export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "pending" | "approved" | "rejected";
export type IncidentCategory = "code" | "infra";

export interface SuggestedAction {
  action_type: "pull_request" | "infra_command" | "config_update" | "rollback";
  category: IncidentCategory;
  // State A: Coder AI fields
  file_path?: string;
  branch_name?: string;
  pr_title?: string;
  pr_body?: string;
  patch_content?: string;
  // State B: Infra AI fields
  terminal_command?: string;
  target_environment?: string;
  estimated_impact?: string;
}

export interface AgentAlphaOutput {
  agent_name: string;
  severity: IncidentSeverity;
  root_cause: string;
  needs_senior_escalation: boolean;
  simulated_slack_alert_text: string;
  anomaly_confidence: number;
}

export interface AgentBetaOutput {
  agent_name: string;
  assigned_team: string;
  jira_ticket_title: string;
  priority_level: "P0 - Blocker" | "P1 - High" | "P2 - Medium" | "P3 - Low";
  sla_target: string;
  routing_decision: "coder_agent" | "infra_agent";
  routing_reason: string;
}

export interface AgentGammaOutput {
  agent_name: string;
  file_path: string;
  patch_content: string;
  branch_name: string;
  commit_message: string;
}

export interface AgentInfraOutput {
  agent_name: string;
  terminal_command: string;
  target_environment: string;
  estimated_impact: string;
  rollback_command?: string;
}

export interface MultiAgentWorkflow {
  triage_agent: AgentAlphaOutput;
  ops_agent: AgentBetaOutput;
  coder_agent?: AgentGammaOutput | null;
  infra_agent?: AgentInfraOutput | null;
  orchestrated_at: string;
  total_duration_ms: number;
}

export interface AIAnalysis {
  title: string;
  severity: IncidentSeverity;
  root_cause: string;
  executive_summary: string;
  confidence_score: number;
  impact_score: number;
  suggested_action: SuggestedAction;
  multi_agent_workflow?: MultiAgentWorkflow;
}

export interface Incident {
  id: string;
  title: string;
  service_name: string;
  environment: string;
  raw_log: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  ai_analysis: AIAnalysis | null;
  suggested_action: SuggestedAction | null;
  multi_agent_workflow?: MultiAgentWorkflow | null;
  pr_url: string | null;
  pr_number: number | null;
  pr_branch: string | null;
  executed_command?: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
}

export interface WebhookPayload {
  service?: string;
  environment?: string;
  raw_log: string;
  error_type?: string;
  metadata?: Record<string, unknown>;
}
