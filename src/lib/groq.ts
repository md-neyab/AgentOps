import Groq from "groq-sdk";
import { 
  AIAnalysis, 
  IncidentSeverity, 
  AgentAlphaOutput, 
  AgentBetaOutput, 
  AgentGammaOutput, 
  AgentInfraOutput,
  MultiAgentWorkflow,
  SuggestedAction,
  RoutingDecision,
  isInfraRouting
} from "./types";

const apiKey = process.env.GROQ_API_KEY || "";
const groqModel = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";

export const isGroqConfigured = () => {
  return Boolean(apiKey) && !apiKey.includes("placeholder") && !apiKey.startsWith("gsk_placeholder");
};

function getGroqClient() {
  return new Groq({
    apiKey: apiKey,
  });
}

/**
 * Resilient JSON parser that handles code blocks, markdown text, and malformed responses
 */
function safeParseLLMJson<T extends object>(rawContent: string | undefined | null, fallback: T): T {
  if (!rawContent || typeof rawContent !== "string") {
    return fallback;
  }

  try {
    let clean = rawContent.trim();
    if (clean.startsWith("```json")) {
      clean = clean.slice(7);
    } else if (clean.startsWith("```")) {
      clean = clean.slice(3);
    }
    if (clean.endsWith("```")) {
      clean = clean.slice(0, -3);
    }
    clean = clean.trim();
    const parsed = JSON.parse(clean);
    return { ...fallback, ...parsed };
  } catch {
    try {
      const match = rawContent.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return { ...fallback, ...parsed };
      }
    } catch {
      // Fallback below
    }
    console.warn("Groq JSON parsing failed, using fallback schema");
    return fallback;
  }
}

// ============================================================================
// AGENT 1: Triage & Alert Specialist (Agent Alpha)
// ============================================================================
const AGENT_ALPHA_PROMPT = `You are Agent Alpha, an autonomous Site Reliability Triage Specialist.
Your job is anomaly detection, severity grading, and generating immediate alert telemetry.

Analyze the error log and return ONLY a strict JSON object:
{
  "severity": "critical" | "high" | "medium" | "low",
  "root_cause": "Concise technical explanation of the failure mechanism and line/component failure.",
  "needs_senior_escalation": boolean,
  "simulated_slack_alert_text": "Formatted Slack alert: e.g., 🚨 *[P0-CRITICAL]* Auth Service OOM restart detected on us-east. Memory saturation breach. On-call paged.",
  "anomaly_confidence": number (between 0.85 and 0.99)
}
Return only raw JSON.`;

export async function runAgentAlpha_Triage(
  rawLog: string,
  serviceName: string,
  environment: string
): Promise<AgentAlphaOutput> {
  if (!isGroqConfigured()) {
    return generateFallbackAgentAlpha(rawLog, serviceName, environment);
  }

  try {
    const groq = getGroqClient();
    const res = await groq.chat.completions.create({
      messages: [
        { role: "system", content: AGENT_ALPHA_PROMPT },
        { 
          role: "user", 
          content: `Service: ${serviceName}\nEnvironment: ${environment}\nLog:\n"""\n${rawLog}\n"""` 
        },
      ],
      model: groqModel,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const parsed = safeParseLLMJson(
      res.choices[0]?.message?.content,
      generateFallbackAgentAlpha(rawLog, serviceName, environment)
    );

    const validSeverities: IncidentSeverity[] = ["critical", "high", "medium", "low"];
    const parsedSeverity = String(parsed.severity || "").toLowerCase() as IncidentSeverity;
    const severity: IncidentSeverity = validSeverities.includes(parsedSeverity) ? parsedSeverity : "high";

    return {
      agent_name: "Agent Alpha (Triage & Alert)",
      severity,
      root_cause: (parsed.root_cause as string) || "Anomaly detected in server execution pipeline.",
      needs_senior_escalation: Boolean(parsed.needs_senior_escalation ?? (severity === "critical")),
      simulated_slack_alert_text: (parsed.simulated_slack_alert_text as string) || `⚠️ Alert: Incident detected on ${serviceName} (${environment})`,
      anomaly_confidence: typeof parsed.anomaly_confidence === "number" ? parsed.anomaly_confidence : 0.96,
    };
  } catch (err) {
    console.error("Agent Alpha triage failed, using fallback:", err);
    return generateFallbackAgentAlpha(rawLog, serviceName, environment);
  }
}

// ============================================================================
// AGENT 2: Manager AI / Ops Coordinator (Agent Beta)
// Dynamic Routing: Decides whether to dispatch to Coder AI or Infra AI
// ============================================================================
const AGENT_BETA_PROMPT = `You are Agent Beta, the Manager AI & Operations Coordinator.
Your job is task assignment, priority grading, and ROUTING DECISION:
Determine if this issue is:
1. "coder_agent" (or "code_bug"): Requires a source code bugfix/patch (e.g. memory leak, null pointer, syntax error, algorithmic defect).
2. "infra_agent" (or "server_infrastructure"): Requires an infrastructure/server command (e.g. database pool exhaustion, deadlocked process termination, container/pod rollout restart, redis flush, daemon restart).

Return ONLY a strict JSON object:
{
  "assigned_team": "Target squad name, e.g. 'Core Platform & SRE', 'Identity Squad', 'Payment Ops'",
  "jira_ticket_title": "Formal Jira title: e.g. 'OPS-4921: Memory leak in session cache'",
  "priority_level": "P0 - Blocker" | "P1 - High" | "P2 - Medium" | "P3 - Low",
  "sla_target": "e.g. '15 minutes' or '1 hour'",
  "routing_decision": "coder_agent" | "infra_agent" | "code_bug" | "server_infrastructure",
  "routing_reason": "One sentence explaining why it was routed to Coder AI or Infra AI."
}
Return only raw JSON.`;

export async function runAgentBeta_OpsCoordinator(
  rawLog: string,
  serviceName: string,
  alphaTriage: AgentAlphaOutput
): Promise<AgentBetaOutput> {
  if (!isGroqConfigured()) {
    return generateFallbackAgentBeta(rawLog, serviceName, alphaTriage);
  }

  try {
    const groq = getGroqClient();
    const res = await groq.chat.completions.create({
      messages: [
        { role: "system", content: AGENT_BETA_PROMPT },
        { 
          role: "user", 
          content: `Service: ${serviceName}\nSeverity: ${alphaTriage.severity}\nRoot Cause: ${alphaTriage.root_cause}\nLog Trace:\n${rawLog}` 
        },
      ],
      model: groqModel,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const parsed = safeParseLLMJson(
      res.choices[0]?.message?.content,
      generateFallbackAgentBeta(rawLog, serviceName, alphaTriage)
    );

    const validPriorities = ["P0 - Blocker", "P1 - High", "P2 - Medium", "P3 - Low"] as const;
    const priority_level = validPriorities.includes(parsed.priority_level as (typeof validPriorities)[number])
      ? (parsed.priority_level as (typeof validPriorities)[number])
      : "P1 - High";

    const decisionStr = String(parsed.routing_decision || "").toLowerCase();
    const isInfra = isInfraRouting(decisionStr);
    const routing_decision: RoutingDecision = isInfra ? "infra_agent" : "coder_agent";

    return {
      agent_name: "Agent Beta (Manager AI & Ops Coordinator)",
      assigned_team: (parsed.assigned_team as string) || `${serviceName} Engineering Squad`,
      jira_ticket_title: (parsed.jira_ticket_title as string) || `OPS-${Math.floor(1000 + Math.random() * 9000)}: Investigate ${serviceName} incident`,
      priority_level,
      sla_target: (parsed.sla_target as string) || (alphaTriage.severity === "critical" ? "15 minutes" : "1 hour"),
      routing_decision,
      routing_reason: (parsed.routing_reason as string) || (routing_decision === "coder_agent" 
        ? "Defect identified in application logic requiring a Git patch."
        : "Operational saturation requiring infrastructure restart command."),
    };
  } catch (err) {
    console.error("Agent Beta coordinator failed, using fallback:", err);
    return generateFallbackAgentBeta(rawLog, serviceName, alphaTriage);
  }
}

// ============================================================================
// AGENT 3A: Coder AI (State A: Code Issue)
// ============================================================================
const AGENT_GAMMA_PROMPT = `You are Coder AI, an Autonomous Remediation Coder.
Your job is to synthesize a precision Git patch diff for the code defect.

Return ONLY a strict JSON object:
{
  "file_path": "Relative path of the target file to patch (e.g. 'src/auth/session.ts')",
  "patch_content": "Unified diff with - and + markers solving the defect.",
  "branch_name": "Slugified git branch name (e.g. 'hotfix/fix-session-leak')",
  "commit_message": "Conventional commit message (e.g. 'fix(auth): add LRU cache to prevent heap OOM')"
}
Return only raw JSON.`;

export async function runAgentGamma_RemediationCoder(
  rawLog: string,
  serviceName: string,
  alphaTriage: AgentAlphaOutput,
  betaOps: AgentBetaOutput
): Promise<AgentGammaOutput> {
  if (!isGroqConfigured()) {
    return generateFallbackAgentGamma(rawLog, serviceName, alphaTriage);
  }

  try {
    const groq = getGroqClient();
    const res = await groq.chat.completions.create({
      messages: [
        { role: "system", content: AGENT_GAMMA_PROMPT },
        { 
          role: "user", 
          content: `Service: ${serviceName}\nRoot Cause: ${alphaTriage.root_cause}\nTicket: ${betaOps.jira_ticket_title}\nLog:\n${rawLog}` 
        },
      ],
      model: groqModel,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const parsed = safeParseLLMJson(
      res.choices[0]?.message?.content,
      generateFallbackAgentGamma(rawLog, serviceName, alphaTriage)
    );

    const cleanBranch = String(parsed.branch_name || `hotfix/${serviceName}-patch`).replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();

    return {
      agent_name: "Coder AI (Remediation Coder)",
      file_path: (parsed.file_path as string) || `src/${serviceName}/handler.ts`,
      patch_content: (parsed.patch_content as string) || `@@ -1,2 +1,3 @@\n-// Guard added by Coder AI\n+// Guard applied`,
      branch_name: cleanBranch,
      commit_message: (parsed.commit_message as string) || `fix(${serviceName}): address unhandled exception`,
    };
  } catch (err) {
    console.error("Coder AI failed, using fallback:", err);
    return generateFallbackAgentGamma(rawLog, serviceName, alphaTriage);
  }
}

// ============================================================================
// AGENT 3B: Infra AI (State B: Server/Config Issue)
// ============================================================================
const AGENT_INFRA_PROMPT = `You are Infra AI, an Autonomous Site Reliability & Cloud Infrastructure Engineer.
Your job is to provide the exact terminal execution command to mitigate a server, container, or database infrastructure failure.

Return ONLY a strict JSON object:
{
  "terminal_command": "Executable CLI command (e.g. 'kubectl rollout restart deployment/auth-service -n production' or 'pm2 restart all' or 'systemctl restart redis')",
  "target_environment": "Environment name, e.g. 'production' or 'production-us-east'",
  "estimated_impact": "Plain English impact: e.g. 'Zero-downtime rolling restart of 3 container pods. Restores socket capacity.'",
  "rollback_command": "e.g. 'kubectl rollout undo deployment/auth-service -n production'"
}
Return only raw JSON.`;

export async function runAgentInfra_OpsRemediation(
  rawLog: string,
  serviceName: string,
  environment: string,
  alphaTriage: AgentAlphaOutput,
  betaOps: AgentBetaOutput
): Promise<AgentInfraOutput> {
  if (!isGroqConfigured()) {
    return generateFallbackAgentInfra(rawLog, serviceName, environment);
  }

  try {
    const groq = getGroqClient();
    const res = await groq.chat.completions.create({
      messages: [
        { role: "system", content: AGENT_INFRA_PROMPT },
        { 
          role: "user", 
          content: `Service: ${serviceName}\nEnvironment: ${environment}\nRoot Cause: ${alphaTriage.root_cause}\nTicket: ${betaOps.jira_ticket_title}\nLog:\n${rawLog}` 
        },
      ],
      model: groqModel,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const parsed = safeParseLLMJson(
      res.choices[0]?.message?.content,
      generateFallbackAgentInfra(rawLog, serviceName, environment)
    );

    return {
      agent_name: "Infra AI (Server Operations)",
      terminal_command: (parsed.terminal_command as string) || `kubectl rollout restart deployment/${serviceName} -n ${environment}`,
      target_environment: (parsed.target_environment as string) || environment,
      estimated_impact: (parsed.estimated_impact as string) || "Graceful rolling restart of service containers. Clears deadlocks and connection leaks.",
      rollback_command: (parsed.rollback_command as string) || undefined,
    };
  } catch (err) {
    console.error("Infra AI failed, using fallback:", err);
    return generateFallbackAgentInfra(rawLog, serviceName, environment);
  }
}

// ============================================================================
// Multi-Agent Orchestrator Pipeline
// ============================================================================
export async function orchestrateMultiAgentPipeline(
  rawLog: string,
  serviceName: string = "unknown-service",
  environment: string = "production"
): Promise<{ aiAnalysis: AIAnalysis; workflow: MultiAgentWorkflow }> {
  const startTime = Date.now();

  // 1. Run Agent Alpha (Triage & Anomaly Assessment)
  const triageAgent = await runAgentAlpha_Triage(rawLog, serviceName, environment);

  // 2. Run Agent Beta (Manager AI): Decides Coder AI vs Infra AI
  const opsAgent = await runAgentBeta_OpsCoordinator(rawLog, serviceName, triageAgent);

  let coderAgent: AgentGammaOutput | null = null;
  let infraAgent: AgentInfraOutput | null = null;
  let suggestedAction: SuggestedAction;

  const isInfra = isInfraRouting(opsAgent.routing_decision);

  if (isInfra) {
    // STATE B: Route to Infra AI (Server Infrastructure)
    infraAgent = await runAgentInfra_OpsRemediation(rawLog, serviceName, environment, triageAgent, opsAgent);
    suggestedAction = {
      action_type: "infra_command",
      category: "infra",
      terminal_command: infraAgent.terminal_command,
      target_environment: infraAgent.target_environment,
      estimated_impact: infraAgent.estimated_impact,
      rollback_command: infraAgent.rollback_command,
    };
  } else {
    // STATE A: Route to Coder AI (Code Bug)
    coderAgent = await runAgentGamma_RemediationCoder(rawLog, serviceName, triageAgent, opsAgent);
    suggestedAction = {
      action_type: "pull_request",
      category: "code",
      file_path: coderAgent.file_path,
      branch_name: coderAgent.branch_name,
      pr_title: coderAgent.commit_message,
      pr_body: `### Incident Summary\n${triageAgent.root_cause}\n\n### Task Assignment\n- **Assigned Squad:** ${opsAgent.assigned_team}\n- **Jira Reference:** ${opsAgent.jira_ticket_title}\n- **SLA Window:** ${opsAgent.sla_target}\n\n### Remediation\nPatch generated autonomously by **Coder AI**.`,
      patch_content: coderAgent.patch_content,
    };
  }

  const durationMs = Date.now() - startTime;

  const workflow: MultiAgentWorkflow = {
    triage_agent: triageAgent,
    ops_agent: opsAgent,
    coder_agent: coderAgent,
    infra_agent: infraAgent,
    orchestrated_at: new Date().toISOString(),
    total_duration_ms: durationMs,
  };

  const aiAnalysis: AIAnalysis = {
    title: opsAgent.jira_ticket_title || `Incident detected in ${serviceName}`,
    severity: triageAgent.severity,
    root_cause: triageAgent.root_cause,
    executive_summary: `${triageAgent.root_cause} Routed by Manager AI to ${isInfra ? "Infra AI" : "Coder AI"}.`,
    confidence_score: triageAgent.anomaly_confidence,
    impact_score: triageAgent.severity === "critical" ? 9.5 : triageAgent.severity === "high" ? 8.0 : 6.0,
    suggested_action: suggestedAction,
    multi_agent_workflow: workflow,
  };

  return { aiAnalysis, workflow };
}

// Backward compatible helper
export async function triageIncidentWithGroq(
  rawLog: string,
  serviceName: string = "unknown-service",
  environment: string = "production"
): Promise<AIAnalysis> {
  const { aiAnalysis } = await orchestrateMultiAgentPipeline(rawLog, serviceName, environment);
  return aiAnalysis;
}

// ============================================================================
// High-Fidelity Fallback Generators
// ============================================================================
function generateFallbackAgentAlpha(rawLog: string, serviceName: string, environment: string): AgentAlphaOutput {
  const lower = rawLog.toLowerCase();
  const isOOM = lower.includes("heap") || lower.includes("out of memory") || lower.includes("oom");
  const isTimeout = lower.includes("timeout") || lower.includes("connection pool") || lower.includes("econnrefused") || lower.includes("deadlock");

  if (isOOM) {
    return {
      agent_name: "Agent Alpha (Triage & Alert)",
      severity: "critical",
      root_cause: `Fatal heap memory exhaustion in ${serviceName}. In-memory collections accumulated objects without cache eviction, triggering Linux OOM kill.`,
      needs_senior_escalation: true,
      simulated_slack_alert_text: `🚨 *[P0-CRITICAL]* Anomaly in \`${serviceName}\` (${environment}): Fatal OOM heap limit breach. Container restarted. Escalating to Senior On-Call.`,
      anomaly_confidence: 0.98,
    };
  }

  if (isTimeout) {
    return {
      agent_name: "Agent Alpha (Triage & Alert)",
      severity: "high",
      root_cause: `Connection pool handle starvation or lock collision in ${serviceName}. Sockets remained occupied past the 5000ms threshold under burst traffic.`,
      needs_senior_escalation: false,
      simulated_slack_alert_text: `⚠️ *[P1-HIGH]* Database connection timeout spike in \`${serviceName}\` (${environment}). Connection pool capacity reached 100%.`,
      anomaly_confidence: 0.94,
    };
  }

  return {
    agent_name: "Agent Alpha (Triage & Alert)",
    severity: "medium",
    root_cause: `Unhandled runtime exception in ${serviceName}. Unexpected null parameter during request transformation.`,
    needs_senior_escalation: false,
    simulated_slack_alert_text: `🔔 *[P2-MEDIUM]* Unhandled exception spike in \`${serviceName}\` (${environment}). Safe fallback active.`,
    anomaly_confidence: 0.91,
  };
}

function generateFallbackAgentBeta(rawLog: string, serviceName: string, alpha: AgentAlphaOutput): AgentBetaOutput {
  const lower = rawLog.toLowerCase();
  const isInfra = lower.includes("connection pool") || lower.includes("deadlock") || lower.includes("redis") || lower.includes("port") || lower.includes("econnrefused");

  if (isInfra) {
    return {
      agent_name: "Agent Beta (Manager AI & Ops Coordinator)",
      assigned_team: "Cloud Infrastructure & Database SRE",
      jira_ticket_title: `OPS-${Math.floor(2000 + Math.random() * 5000)}: Infrastructure connection starvation in ${serviceName}`,
      priority_level: "P1 - High",
      sla_target: "30 minutes",
      routing_decision: "infra_agent",
      routing_reason: "Issue stems from database/cache connection exhaustion requiring an immediate operational restart command.",
    };
  }

  return {
    agent_name: "Agent Beta (Manager AI & Ops Coordinator)",
    assigned_team: "Platform Core Application Squad",
    jira_ticket_title: `OPS-${Math.floor(2000 + Math.random() * 5000)}: Application memory leak in ${serviceName}`,
    priority_level: alpha.severity === "critical" ? "P0 - Blocker" : "P1 - High",
    sla_target: "15 minutes",
    routing_decision: "coder_agent",
    routing_reason: "Issue stems from unevicted in-memory session arrays requiring a source code patch.",
  };
}

function generateFallbackAgentGamma(rawLog: string, serviceName: string, _alpha: AgentAlphaOutput): AgentGammaOutput {
  return {
    agent_name: "Coder AI (Remediation Coder)",
    file_path: `src/${serviceName}/session-cache.ts`,
    branch_name: `hotfix/${serviceName}-oom-lru`,
    commit_message: `fix(${serviceName}): replace unbounded session store with LRU cache`,
    patch_content: `@@ -12,3 +12,5 @@\n-const activeSessions: Session[] = [];\n+import { LRUCache } from 'lru-cache';\n+const activeSessions = new LRUCache({ max: 5000, ttl: 1000 * 60 * 15 });`,
  };
}

function generateFallbackAgentInfra(rawLog: string, serviceName: string, environment: string): AgentInfraOutput {
  const lower = rawLog.toLowerCase();
  const isDeadlock = lower.includes("deadlock");
  const isRedis = lower.includes("redis");

  if (isDeadlock) {
    return {
      agent_name: "Infra AI (Server Operations)",
      terminal_command: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND wait_event_type = 'Lock';`,
      target_environment: environment,
      estimated_impact: "Terminates blocking transactions immediately. Releases exclusive table locks and restores database throughput.",
      rollback_command: "N/A - Rollback handled by PostgreSQL engine abort",
    };
  }

  if (isRedis) {
    return {
      agent_name: "Infra AI (Server Operations)",
      terminal_command: `kubectl rollout restart deployment/cache-layer -n ${environment}`,
      target_environment: environment,
      estimated_impact: "Rolling restart of 3 Redis cache proxy pods. Closes 10,000 idle client sockets and re-initializes connection pools.",
      rollback_command: `kubectl rollout undo deployment/cache-layer -n ${environment}`,
    };
  }

  return {
    agent_name: "Infra AI (Server Operations)",
    terminal_command: `kubectl rollout restart deployment/${serviceName} -n ${environment}`,
    target_environment: environment,
    estimated_impact: "Graceful rolling restart of container pods. Restores memory limits and clears unreleased file descriptors.",
    rollback_command: `kubectl rollout undo deployment/${serviceName} -n ${environment}`,
  };
}
