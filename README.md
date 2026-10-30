# AgentOps AI — Enterprise SaaS Incident Assistant

> **Agentic Operations Assistant** prototype built for high-velocity enterprise incident triage and remediation using **Groq API (Llama 3)** and **Human-in-the-Loop (HITL)** governance.

---

## ⚡ Quick Start

### 1. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your API keys in `.env.local`:
```env
# Groq API (Ultra-fast Llama-3 inference)
GROQ_API_KEY=gsk_your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# Supabase (Optional for local demo; automatically falls back to in-memory store)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# GitHub Automation (Optional; falls back to simulated PR mode if omitted)
GITHUB_TOKEN=ghp_your_github_token
GITHUB_OWNER=your-org
GITHUB_REPO=your-repo
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧭 Application Map

- **`/` — Incident Command Dashboard:** 3 live KPI cards (Total, Pending Review, Resolved via Auto-PR), searchable real-time incident queue with severity badges and live updates.
- **`/incident/[id]` — Split Incident Console:** 
  - **Left:** Raw terminal stderr stream with stack trace viewer and copy utility.
  - **Right:** Groq Llama-3 structured root-cause analysis, blast radius metrics, target branch, and unified Git diff patch.
  - **Bottom Dock:** Human-in-the-loop action controls (**"Approve & Open GitHub PR"** vs **"Reject Fix"**).
- **`/settings` — Judge Demo Suite & Webhook Simulator:** 
  - Live public ingestion webhook endpoint (`POST /api/webhooks/incident`).
  - 1-Click quick presets (Node.js OOM Crash, Postgres Deadlock, Redis Saturation, JWT Undefined).
  - Custom payload dispatcher.
- **`/analytics` — Business ROI Dashboard:**
  - Interactive Recharts graphs proving MTTR drop (45m $\rightarrow$ 1.4m), developer hours reclaimed, and automated remediation ratios.

---

## 📡 Live Ingestion Webhook

Send raw error logs from any alerting system:
```bash
curl -X POST "http://localhost:3000/api/webhooks/incident" \
  -H "Content-Type: application/json" \
  -d '{
    "service": "billing-service",
    "environment": "production-us-east",
    "raw_log": "ERROR: deadlock detected at process 8291..."
  }'
```
Response (`201 Created`):
```json
{
  "success": true,
  "incident_id": "87586b7d-f98e-469b-a731-4ab9e508357a",
  "status": "pending",
  "triage_status": "completed",
  "message": "Incident successfully ingested and analyzed via Groq Llama-3."
}
```

