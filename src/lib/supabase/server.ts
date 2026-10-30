import { createClient } from "@supabase/supabase-js";
import { Incident } from "../types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const isServerSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && !url.includes("placeholder") && key && !key.includes("placeholder"));
};

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// In-memory mock store fallback for standalone development / demo reliability
declare global {
  // eslint-disable-next-line no-var
  var __mockIncidentsStore: Incident[] | undefined;
}

export const initialSeedIncidents: Incident[] = [
  // --------------------------------------------------------------------------
  // STATE A: Code Issue -> Coder AI (Git Patch)
  // --------------------------------------------------------------------------
  {
    id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    title: "OOMKilled: JavaScript heap out of memory",
    service_name: "auth-service",
    environment: "production-us-east",
    severity: "critical",
    status: "pending",
    raw_log: `<--- Last few GCs --->
[14285:0x5e30000]    42012 ms: Mark-sweep (reduce) 2047.8 (2052.2) -> 2046.9 (2052.5) MB, 142.1 / 0.0 ms  (average mu = 0.128, current mu = 0.014) allocation failure; scavenge might not succeed
[14285:0x5e30000]    42168 ms: Mark-sweep (reduce) 2047.9 (2052.5) -> 2047.1 (2052.5) MB, 154.6 / 0.0 ms  (average mu = 0.067, current mu = 0.007) allocation failure; scavenge might not succeed

<--- JS stacktrace --->
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
 1: 0xb79850 node::Abort() [node]
 2: 0xa92f12 v8::internal::V8::FatalProcessOutOfMemory(v8::internal::Isolate*, char const*, bool) [node]
 3: 0xc87d4a v8::internal::Heap::AllocateRawWithRetryOrFailSlowPath(int, v8::internal::AllocationType, v8::internal::AllocationOrigin) [node]
    at SessionManager.trackSession (/app/dist/session.js:142:18)
    at IncomingMessage.<anonymous> (/app/dist/server.js:89:12)`,
    ai_analysis: {
      title: "OOMKilled: JavaScript heap out of memory in SessionManager",
      severity: "critical",
      root_cause: "Unbounded array accumulation in user session handler causing rapid heap memory exhaustion during high concurrency token refresh requests.",
      executive_summary: "The auth-service crashed due to a Node.js heap limit breach triggered by unevicted in-memory session objects.",
      confidence_score: 0.98,
      impact_score: 9.4,
      suggested_action: {
        action_type: "pull_request",
        category: "code",
        file_path: "src/auth/session.ts",
        branch_name: "hotfix/inc-8942-oom",
        pr_title: "fix(auth): replace unbounded array with LRU cache for active sessions",
        pr_body: "### Incident Summary\nResolved critical OOM condition caused by unbounded session growth.\n\n### Root Cause\n`activeSessions` array accumulated active tokens indefinitely without eviction.\n\n### Changes\nReplaced array with LRUCache with 5000 item capacity and 15min TTL.",
        patch_content: `@@ -12,3 +12,5 @@
-const activeSessions: Session[] = [];
+import { LRUCache } from 'lru-cache';
+const activeSessions = new LRUCache<string, Session>({ max: 5000, ttl: 1000 * 60 * 15 });`,
      },
    },
    suggested_action: {
      action_type: "pull_request",
      category: "code",
      file_path: "src/auth/session.ts",
      branch_name: "hotfix/inc-8942-oom",
      pr_title: "fix(auth): replace unbounded array with LRU cache for active sessions",
      pr_body: "### Incident Summary\nResolved critical OOM condition caused by unbounded session growth.\n\n### Root Cause\n`activeSessions` array accumulated active tokens indefinitely without eviction.\n\n### Changes\nReplaced array with LRUCache with 5000 item capacity and 15min TTL.",
      patch_content: `@@ -12,3 +12,5 @@
-const activeSessions: Session[] = [];
+import { LRUCache } from 'lru-cache';
+const activeSessions = new LRUCache<string, Session>({ max: 5000, ttl: 1000 * 60 * 15 });`,
    },
    multi_agent_workflow: {
      triage_agent: {
        agent_name: "Agent Alpha (Triage & Alert)",
        severity: "critical",
        root_cause: "Unbounded array accumulation in user session handler causing rapid heap memory exhaustion during high concurrency token refresh requests.",
        needs_senior_escalation: true,
        simulated_slack_alert_text: "🚨 *[P0-CRITICAL]* Anomaly in `auth-service` (production-us-east): Fatal OOM heap limit breach. Container restarted. Escalating to Senior On-Call.",
        anomaly_confidence: 0.98,
      },
      ops_agent: {
        agent_name: "Agent Beta (Manager AI & Ops Coordinator)",
        assigned_team: "Platform Core / SRE Squad",
        jira_ticket_title: "OPS-8942: Critical Heap Memory Saturation in Auth Gateway",
        priority_level: "P0 - Blocker",
        sla_target: "15 minutes",
        routing_decision: "coder_agent",
        routing_reason: "Issue stems from unevicted in-memory session arrays requiring a source code patch.",
      },
      coder_agent: {
        agent_name: "Coder AI (Remediation Coder)",
        file_path: "src/auth/session.ts",
        branch_name: "hotfix/inc-8942-oom",
        commit_message: "fix(auth): replace unbounded array with LRU cache for active sessions",
        patch_content: `@@ -12,3 +12,5 @@
-const activeSessions: Session[] = [];
+import { LRUCache } from 'lru-cache';
+const activeSessions = new LRUCache<string, Session>({ max: 5000, ttl: 1000 * 60 * 15 });`,
      },
      orchestrated_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      total_duration_ms: 1140,
    },
    pr_url: null,
    pr_number: null,
    pr_branch: null,
    created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    approved_at: null,
    rejected_at: null,
  },

  // --------------------------------------------------------------------------
  // STATE B: Infra Issue -> Infra AI (Terminal Command)
  // --------------------------------------------------------------------------
  {
    id: "e4a77e52-19e0-47b8-8c01-7fa1743f11d1",
    title: "Redis Connection Pool Exhaustion",
    service_name: "cache-layer",
    environment: "production-eu-west",
    severity: "high",
    status: "pending",
    raw_log: `[ioredis] Unhandled error event: Error: Max clients reached
    at Socket.<anonymous> (/app/node_modules/ioredis/built/redis/index.js:342:21)
    at Socket.emit (node:events:517:28)
    at TCP.onStreamRead (node:internal/js_stream_socket:209:12)`,
    ai_analysis: {
      title: "Redis Max Clients Reached on Session Cache",
      severity: "high",
      root_cause: "Connection pool is not releasing idle sockets during failed keep-alive handshakes, exhausting the 10,000 maxclient ceiling.",
      executive_summary: "Cache layer rejected incoming requests after client connections saturated the Redis server.",
      confidence_score: 0.95,
      impact_score: 8.2,
      suggested_action: {
        action_type: "infra_command",
        category: "infra",
        terminal_command: "kubectl rollout restart deployment/cache-layer -n production-eu-west",
        target_environment: "production-eu-west",
        estimated_impact: "Rolling restart of 3 Redis cache proxy pods. Closes 10,000 idle client sockets and re-initializes connection pools with zero downtime.",
      },
    },
    suggested_action: {
      action_type: "infra_command",
      category: "infra",
      terminal_command: "kubectl rollout restart deployment/cache-layer -n production-eu-west",
      target_environment: "production-eu-west",
      estimated_impact: "Rolling restart of 3 Redis cache proxy pods. Closes 10,000 idle client sockets and re-initializes connection pools with zero downtime.",
    },
    multi_agent_workflow: {
      triage_agent: {
        agent_name: "Agent Alpha (Triage & Alert)",
        severity: "high",
        root_cause: "Connection pool is not releasing idle sockets during failed keep-alive handshakes, exhausting the 10,000 maxclient ceiling.",
        needs_senior_escalation: false,
        simulated_slack_alert_text: "⚠️ *[P1-HIGH]* Redis connection pool saturation on cache-layer (production-eu-west). Sockets unreleased.",
        anomaly_confidence: 0.95,
      },
      ops_agent: {
        agent_name: "Agent Beta (Manager AI & Ops Coordinator)",
        assigned_team: "Cloud Infrastructure & Database SRE",
        jira_ticket_title: "OPS-7721: Redis connection handle leak and socket starvation",
        priority_level: "P1 - High",
        sla_target: "30 minutes",
        routing_decision: "infra_agent",
        routing_reason: "Issue stems from database/cache connection exhaustion requiring an immediate operational restart command.",
      },
      infra_agent: {
        agent_name: "Infra AI (Server Operations)",
        terminal_command: "kubectl rollout restart deployment/cache-layer -n production-eu-west",
        target_environment: "production-eu-west",
        estimated_impact: "Rolling restart of 3 Redis cache proxy pods. Closes 10,000 idle client sockets and re-initializes connection pools with zero downtime.",
        rollback_command: "kubectl rollout undo deployment/cache-layer -n production-eu-west",
      },
      orchestrated_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      total_duration_ms: 1080,
    },
    pr_url: null,
    pr_number: null,
    pr_branch: null,
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    approved_at: null,
    rejected_at: null,
  },

  // --------------------------------------------------------------------------
  // STATE A (Approved): Code Issue -> Coder AI
  // --------------------------------------------------------------------------
  {
    id: "f83a612c-90b1-4f12-9c32-b883011e4f90",
    title: "PostgreSQL Deadlock Detected in Order Settlement",
    service_name: "billing-service",
    environment: "production-us-east",
    severity: "medium",
    status: "approved",
    raw_log: `ERROR: deadlock detected
DETAIL: Process 8291 waits for ExclusiveLock on transaction 91823; blocked by process 8292.
Process 8292 waits for ShareLock on transaction 91822; blocked by process 8291.
HINT: See server log for query details.
LOCATION: DeadLockReport, deadlock.c:1140`,
    ai_analysis: {
      title: "Postgres Concurrent Transaction Deadlock in Billing Ledger",
      severity: "medium",
      root_cause: "Asymmetric acquisition order of ledger rows between checkout settlement and webhook refund handlers.",
      executive_summary: "Two competing workers locked account rows in reverse alphabetical order, triggering a deadlock abort.",
      confidence_score: 0.96,
      impact_score: 6.8,
      suggested_action: {
        action_type: "pull_request",
        category: "code",
        file_path: "src/billing/ledger.ts",
        branch_name: "hotfix/order-deadlock-sort",
        pr_title: "fix(billing): enforce deterministic row sorting prior to SELECT FOR UPDATE",
        pr_body: "Resolves deadlock by ordering row IDs before acquiring row-level locks.",
        patch_content: `@@ -44,3 +44,3 @@
-const rows = await db.query('SELECT * FROM accounts WHERE id IN ($1, $2) FOR UPDATE', [accA, accB]);
+const [first, second] = [accA, accB].sort();
+const rows = await db.query('SELECT * FROM accounts WHERE id IN ($1, $2) ORDER BY id FOR UPDATE', [first, second]);`,
      },
    },
    suggested_action: {
      action_type: "pull_request",
      category: "code",
      file_path: "src/billing/ledger.ts",
      branch_name: "hotfix/order-deadlock-sort",
      pr_title: "fix(billing): enforce deterministic row sorting prior to SELECT FOR UPDATE",
      pr_body: "Resolves deadlock by ordering row IDs before acquiring row-level locks.",
      patch_content: `@@ -44,3 +44,3 @@
-const rows = await db.query('SELECT * FROM accounts WHERE id IN ($1, $2) FOR UPDATE', [accA, accB]);
+const [first, second] = [accA, accB].sort();
+const rows = await db.query('SELECT * FROM accounts WHERE id IN ($1, $2) ORDER BY id FOR UPDATE', [first, second]);`,
    },
    multi_agent_workflow: {
      triage_agent: {
        agent_name: "Agent Alpha (Triage & Alert)",
        severity: "medium",
        root_cause: "Asymmetric acquisition order of ledger rows between checkout settlement and webhook refund handlers.",
        needs_senior_escalation: false,
        simulated_slack_alert_text: "🔔 *[P2-MEDIUM]* Postgres transaction deadlock detected on `billing-service`. Retries triggered.",
        anomaly_confidence: 0.96,
      },
      ops_agent: {
        agent_name: "Agent Beta (Manager AI & Ops Coordinator)",
        assigned_team: "Payments & Ledger Squad",
        jira_ticket_title: "OPS-9182: Concurrent lock collision in checkout settlement",
        priority_level: "P2 - Medium",
        sla_target: "2 hours",
        routing_decision: "coder_agent",
        routing_reason: "Issue stems from unevicted in-memory session arrays requiring a source code patch.",
      },
      coder_agent: {
        agent_name: "Coder AI (Remediation Coder)",
        file_path: "src/billing/ledger.ts",
        branch_name: "hotfix/order-deadlock-sort",
        commit_message: "fix(billing): enforce deterministic row sorting prior to SELECT FOR UPDATE",
        patch_content: `@@ -44,3 +44,3 @@
-const rows = await db.query('SELECT * FROM accounts WHERE id IN ($1, $2) FOR UPDATE', [accA, accB]);
+const [first, second] = [accA, accB].sort();
+const rows = await db.query('SELECT * FROM accounts WHERE id IN ($1, $2) ORDER BY id FOR UPDATE', [first, second]);`,
      },
      orchestrated_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      total_duration_ms: 990,
    },
    pr_url: "https://github.com/md-neyab/AgentOps/pull/3",
    pr_number: 3,
    pr_branch: "hotfix-payment-gateway-pool-tuning-mvv39ly8",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    approved_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    rejected_at: null,
  },
];

if (!global.__mockIncidentsStore) {
  global.__mockIncidentsStore = [...initialSeedIncidents];
}

export const getMockStore = () => {
  if (!global.__mockIncidentsStore) {
    global.__mockIncidentsStore = [...initialSeedIncidents];
  }
  return global.__mockIncidentsStore;
};
