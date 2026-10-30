# API & Data Layer Schema Specification
## Project Name: AgentOps AI

---

### 1. Supabase PostgreSQL Schema

#### 1.1 `incidents` Table Definition

Execute the following SQL in the Supabase SQL Editor to provision the complete data layer with Realtime support enabled:

```sql
-- 1. Create Enums for Incident Lifecycle
CREATE TYPE incident_severity AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE incident_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. Create Incidents Table
CREATE TABLE public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    service_name VARCHAR(100) NOT NULL DEFAULT 'unknown-service',
    environment VARCHAR(50) NOT NULL DEFAULT 'production',
    raw_log TEXT NOT NULL,
    severity incident_severity NOT NULL DEFAULT 'high',
    status incident_status NOT NULL DEFAULT 'pending',
    
    -- Structured AI Analysis Output (JSONB)
    ai_analysis JSONB DEFAULT NULL,
    -- Suggested Remediation Action & Git Patch (JSONB)
    suggested_action JSONB DEFAULT NULL,
    
    -- Pull Request Tracking
    pr_url TEXT DEFAULT NULL,
    pr_number INTEGER DEFAULT NULL,
    pr_branch TEXT DEFAULT NULL,
    
    -- Audit Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    approved_at TIMESTAMPTZ DEFAULT NULL,
    rejected_at TIMESTAMPTZ DEFAULT NULL
);

-- 3. Create Indexes for High-Velocity Queries
CREATE INDEX idx_incidents_status ON public.incidents (status);
CREATE INDEX idx_incidents_severity ON public.incidents (severity);
CREATE INDEX idx_incidents_created_at ON public.incidents (created_at DESC);

-- 4. Enable Supabase Realtime for Instant UI Updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;

-- 5. Row Level Security (RLS) Configuration (Hackathon Permissive)
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to incidents"
    ON public.incidents FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow insert and update for service role & demo client"
    ON public.incidents FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
```

#### 1.2 Initial Seed Data for Demo & Cold-Start Testing

```sql
INSERT INTO public.incidents (
    title, service_name, environment, severity, status, raw_log,
    ai_analysis, suggested_action, pr_url, pr_number, approved_at
) VALUES 
(
    'OOMKilled: JavaScript heap out of memory',
    'auth-service',
    'production-us-east',
    'critical',
    'pending',
    '<--- Last few GCs --->
[14285:0x5e30000]    42012 ms: Mark-sweep (reduce) 2047.8 (2052.2) -> 2046.9 (2052.5) MB, 142.1 / 0.0 ms  (average mu = 0.128, current mu = 0.014) allocation failure; scavenge might not succeed
[14285:0x5e30000]    42168 ms: Mark-sweep (reduce) 2047.9 (2052.5) -> 2047.1 (2052.5) MB, 154.6 / 0.0 ms  (average mu = 0.067, current mu = 0.007) allocation failure; scavenge might not succeed

<--- JS stacktrace --->
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
 1: 0xb79850 node::Abort() [node]
 2: 0xa92f12 v8::internal::V8::FatalProcessOutOfMemory(v8::internal::Isolate*, char const*, bool) [node]
 3: 0xc87d4a v8::internal::Heap::AllocateRawWithRetryOrFailSlowPath(int, v8::internal::AllocationType, v8::internal::AllocationOrigin) [node]
    at SessionManager.trackSession (/app/dist/session.js:142:18)
    at IncomingMessage.<anonymous> (/app/dist/server.js:89:12)',
    '{
        "root_cause": "Unbounded array accumulation in user session handler causing rapid heap memory exhaustion during high concurrency token refresh requests.",
        "confidence_score": 0.98,
        "impact_score": 9.4,
        "executive_summary": "The auth-service crashed due to a Node.js heap limit breach triggered by unevicted in-memory session objects."
    }'::jsonb,
    '{
        "action_type": "pull_request",
        "file_path": "src/auth/session.ts",
        "branch_name": "hotfix/inc-8942-oom",
        "pr_title": "fix(auth): replace unbounded array with LRU cache for active sessions",
        "patch_content": "@@ -12,3 +12,5 @@\n-const activeSessions: Session[] = [];\n+import { LRUCache } from ''lru-cache'';\n+const activeSessions = new LRUCache<string, Session>({ max: 5000, ttl: 1000 * 60 * 15 });"
    }'::jsonb,
    NULL, NULL, NULL
);
```

---

### 2. External Webhook Ingestion API

- **Endpoint:** `POST /api/webhooks/incident`
- **Content-Type:** `application/json`

#### 2.1 Request Payload Schema
```json
{
  "service": "auth-service",
  "environment": "production-us-east",
  "raw_log": "Error: Connection pool exhausted at Pool.connect (/app/db.js:45)...",
  "error_type": "DatabaseTimeout",
  "metadata": {
    "host": "ip-10-0-4-12",
    "cluster": "eks-core-prod",
    "pod": "auth-service-78bf6-xk92m"
  }
}
```

#### 2.2 Ingestion Response Schema
- **Status:** `201 Created`
```json
{
  "success": true,
  "incident_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "pending",
  "triage_status": "completed",
  "message": "Incident ingested and analyzed by Gemini AI successfully."
}
```

---

### 3. Google Gemini Agentic Triage JSON Schema

When sending the raw stack trace to the Gemini API (`gemini-1.5-pro`), the system configures `responseSchema` with the following strict contract:

#### 3.1 Strict Gemini Response JSON Schema
```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Concise headline describing the failure event (e.g., 'Redis Connection Pool Exhaustion in Billing Service')"
    },
    "severity": {
      "type": "string",
      "enum": ["critical", "high", "medium", "low"],
      "description": "Standardized incident severity rating based on blast radius"
    },
    "root_cause": {
      "type": "string",
      "description": "Deep technical analysis explaining exactly why and where the failure occurred"
    },
    "executive_summary": {
      "type": "string",
      "description": "Non-technical executive briefing of the incident suitable for engineering leadership"
    },
    "confidence_score": {
      "type": "number",
      "description": "Confidence percentage of the diagnosis between 0.0 and 1.0"
    },
    "impact_score": {
      "type": "number",
      "description": "Blast radius score from 1.0 to 10.0"
    },
    "suggested_action": {
      "type": "object",
      "properties": {
        "action_type": { "type": "string", "enum": ["pull_request", "config_update", "rollback"] },
        "file_path": { "type": "string", "description": "Relative file path of the source code requiring patching" },
        "branch_name": { "type": "string", "description": "Git branch name for the hotfix (e.g., 'hotfix/inc-fix-redis-timeout')" },
        "pr_title": { "type": "string", "description": "Conventional commit title for the GitHub Pull Request" },
        "pr_body": { "type": "string", "description": "Rich markdown description of the remediation for reviewer context" },
        "patch_content": { "type": "string", "description": "Unified Git diff or replacement code snippet to solve the issue" }
      },
      "required": ["action_type", "file_path", "branch_name", "pr_title", "pr_body", "patch_content"]
    }
  },
  "required": ["title", "severity", "root_cause", "executive_summary", "confidence_score", "impact_score", "suggested_action"]
}
```

---

### 4. Human-in-the-Loop Approval & Rejection APIs

#### 4.1 Approve Incident Endpoint
- **Endpoint:** `POST /api/incidents/[id]/approve`
- **Description:** Invokes GitHub REST API, creates hotfix branch, commits patch, opens Pull Request, and marks incident `approved`.

**Request Body:**
```json
{
  "approved_by": "Alex Chen",
  "override_notes": "Optional notes from engineer prior to auto-commit"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "incident_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "approved",
  "github": {
    "pr_url": "https://github.com/enterprise-org/auth-service/pull/42",
    "pr_number": 42,
    "branch": "hotfix/inc-8942-oom"
  },
  "approved_at": "2026-10-30T13:46:02.124Z"
}
```

#### 4.2 Reject Incident Endpoint
- **Endpoint:** `POST /api/incidents/[id]/reject`
- **Description:** Marks the incident as `rejected` and dismisses triage.

**Request Body:**
```json
{
  "rejected_by": "Alex Chen",
  "rejection_reason": "False positive; scheduled batch job load spike"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "incident_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "rejected",
  "rejected_at": "2026-10-30T13:47:15.541Z"
}
```

