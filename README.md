# AgentOps AI — Autonomous Multi-Agent Incident Remediation

> **Enterprise Site Reliability Engineering (SRE) Assistant** powered by a **Hierarchical Multi-Agent Architecture** (Main Orchestrator AI, Coder AI, Infra AI) with strict **Human-in-the-Loop (HITL)** governance and live **GitHub PR & Server CLI automation**.

📖 **[Read the Full System Architecture & Engineering Documentation →](./DOCUMENTATION.md)**

---

## 🚀 Key Architectural Highlights

- **Hierarchical Multi-Agent Pipeline (Problem Statement 2):**
  - **Main Orchestrator AI (Gemini Core):** Sits alone at the top center. Diagnoses root cause, assesses severity, assigns Jira squad, and makes the dynamic routing decision.
  - **Dynamic Single-Worker Delegation:**
    - **Coder AI:** Synthesizes unified Git diff patches, creates hotfix branches, and opens real **GitHub Pull Requests**.
    - **Infra AI:** Synthesizes non-destructive shell execution commands (`psql`, `kubectl`) to clear operational saturation.
    - **Standby Isolation:** The non-selected worker is cleanly bypassed to eliminate accidental code/server churn.
- **Human-in-the-Loop (HITL) Governance:**
  - Zero autonomous changes without human sign-off.
  - One-click approval triggers either GitHub PR creation or server CLI execution with verified exit codes.
- **100% Real Live Analytics:**
  - Real MTTR dynamically calculated from `resolved_at - created_at` in Supabase.
  - Real service distribution (no artificial `Math.max` padding).
  - Live Remediation Audit Trail table.

---

## ⚡ Quick Start

### 1. Environment Configuration
Create `.env.local` in the project root:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Groq LPU Inference
GROQ_API_KEY=gsk_your_groq_api_key
GROQ_MODEL=qwen/qwen3.8-27b

# GitHub API Automation
GITHUB_TOKEN=github_pat_your_token
GITHUB_OWNER=your-github-username
GITHUB_REPO=your-repo-name

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Run the Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧭 Application Map

- **`/` — Live Incident Queue:** Real-time stream of pending and resolved incidents with severity badges.
- **`/incident/[id]` — Multi-Agent Command Center:** 
  - **Top:** Main Orchestrator AI card with Google Gemini branding and root-cause diagnosis.
  - **Middle:** Left Coder AI vs Right Infra AI worker delegation cards.
  - **Bottom:** Clean white-theme production crash trace with line numbers.
- **`/settings` — Ingestion & Presets Simulator:** 1-Click webhook triggers for PostgreSQL Deadlock, JavaScript OOM, Redis Saturation, and JWT Key Missing.
- **`/analytics` — Real-Time Impact Dashboard:** Real MTTR, time/cost savings, microservice breakdowns, and live audit trail.

---

## 📡 Live Ingestion Webhook

Send runtime crash logs from any external alerting service (Datadog, Sentry, CloudWatch):
```bash
curl -X POST "http://localhost:3000/api/webhooks/incident" \
  -H "Content-Type: application/json" \
  -d '{
    "service": "billing-service",
    "environment": "production",
    "raw_log": "ERROR: deadlock detected in Postgres ledger update at process 1402"
  }'
```

Response:
```json
{
  "success": true,
  "incident_id": "3dc46b39-33c5-453c-86e0-082e2a609f9b",
  "status": "pending",
  "routing": "infra_agent",
  "message": "Incident ingested and routed via Multi-Agent pipeline."
}
```

---

## 📄 Documentation

For full architecture diagrams, database schema definitions, mathematical formulas, and the live evaluator demo guide, read **[DOCUMENTATION.md](./DOCUMENTATION.md)**.
