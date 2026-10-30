export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "pending" | "approved" | "rejected";

export interface SuggestedAction {
  action_type: "pull_request" | "config_update" | "rollback";
  file_path: string;
  branch_name: string;
  pr_title: string;
  pr_body: string;
  patch_content: string;
}

export interface AIAnalysis {
  title: string;
  severity: IncidentSeverity;
  root_cause: string;
  executive_summary: string;
  confidence_score: number;
  impact_score: number;
  suggested_action: SuggestedAction;
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
  pr_url: string | null;
  pr_number: number | null;
  pr_branch: string | null;
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

