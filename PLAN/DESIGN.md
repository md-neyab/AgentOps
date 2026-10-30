# UI/UX Blueprint & Design System
## Project Name: AgentOps AI — Enterprise SaaS Console

---

### 1. Design System & Brand Identity

AgentOps AI adopts a **Dark-Mode First, High-Density Cyber-DevOps** aesthetic inspired by modern enterprise developer tools like Vercel, Supabase, Datadog, and Linear. The interface balances high-density information displays with generous padding and crisp visual hierarchy, ensuring SREs can inspect complex logs without visual fatigue.

#### 1.1 Color Palette Tokens

```css
/* Core Backgrounds & Surfaces */
--bg-canvas: #090d16;        /* Deep void background */
--bg-surface: #0f172a;       /* Slate-900 surface panels */
--bg-surface-elevated: #1e293b; /* Slate-800 card & dropdown highlights */
--border-subtle: #1e293b;    /* Slate-800 borders */
--border-strong: #334155;    /* Slate-700 active borders */

/* Typography Colors */
--text-primary: #f8fafc;     /* Slate-50 primary headings */
--text-secondary: #94a3b8;   /* Slate-400 labels and descriptions */
--text-muted: #64748b;       /* Slate-500 timestamps and metadata */

/* Semantic Status Accents */
--status-critical: #ef4444;  /* Red-500 (Fatal, Out of Memory) */
--status-high: #f97316;      /* Orange-500 (Exceptions, Timeouts) */
--status-medium: #eab308;    /* Yellow-500 (Degraded, Warnings) */
--status-low: #3b82f6;       /* Blue-500 (Notice, Minor Glitches) */

--status-pending: #a855f7;   /* Purple-500 (Awaiting SRE Approval) */
--status-approved: #10b981;  /* Emerald-500 (Remediated / PR Opened) */
--status-rejected: #64748b;  /* Slate-500 (Dismissed) */

/* Interactive Brand Glows */
--brand-cyan: #06b6d4;       /* Cyan-500 (Agentic AI Intelligence highlight) */
--brand-indigo: #6366f1;     /* Indigo-500 (Primary buttons & focus rings) */
```

#### 1.2 Typography
- **Primary Body & Display:** `Inter`, `sans-serif` (Clarity, readability, neutral tone).
- **Code, Logs & Diffs:** `JetBrains Mono`, `ui-monospace`, `monospace` (Fixed-width alignment for stack traces, JSON, and terminal output).

#### 1.3 Key UI Principles
1. **Zero-Latency Feel:** Instant optimistic updates, glowing pulses for pending states, and zero full-page flashes.
2. **Context-Preserving Split Views:** SREs never lose sight of the raw stack trace while reading the AI's proposed solution.
3. **High-Stakes HITL Ergonomics:** Clear, high-contrast action triggers with prominent confirmation feedback to eliminate operational mistakes.

---

### 2. Global Shell & Navigation Architecture

The application is structured inside a persistent two-column layout:
- **Left Column:** Fixed 240px Global Sidebar.
- **Top Bar:** Breadcrumbs, Environment Pill (`Production - US-East-1`), Live Webhook Status indicator, and Quick Action buttons.
- **Main Viewport:** Scrollable dynamic content area (`flex-1 overflow-y-auto`).

#### 2.1 Global Sidebar Specification

```
+-----------------------------------------------------------+
| [⚡ AGENT OPS AI]                      [Prod v1.0.4]      |
| Autonomous SRE Assistant                                  |
+-----------------------------------------------------------+
| NAVIGATION                                                |
|  [⚡] Incidents Dashboard               (/)        [ 3 ]   |
|  [🔬] Incident Detail & Approval        (/incident/[id])  |
|  [⚙️] Webhook Simulator (Demo)          (/settings)       |
|  [📈] Analytics & ROI                   (/analytics)      |
+-----------------------------------------------------------+
| SYSTEM TELEMETRY                                          |
|  Supabase Realtime: ● Connected                           |
|  Gemini Agent API:  ● Operational                         |
|  GitHub Integrator: ● Linked (octocat/repo)               |
+-----------------------------------------------------------+
| [User Avatar] Alex Chen (Staff SRE)                       |
+-----------------------------------------------------------+
```

---

### 3. Page 1: Main Dashboard (`/`)

#### 3.1 Layout & Hierarchy

```
+-----------------------------------------------------------------------------------------+
| Dashboard > Real-Time Incident Monitor                        [+ Simulate Incident]     |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  +--------------------+   +--------------------+   +--------------------+               |
|  | TOTAL INCIDENTS    |   | PENDING TRIAGE     |   | RESOLVED / PR OPEN |               |
|  |       128          |   |        3           |   |        125         |               |
|  | +12% vs last 24h   |   | Requires Review ⚠️ |   | 97.6% Success Rate |               |
|  +--------------------+   +--------------------+   +--------------------+               |
|                                                                                         |
|  ACTIVE INCIDENTS QUEUE                                                                 |
|  [Search incidents...]   [Filter: All Severities ▼]   [Status: All ▼]    [🔴 Live Stream]|
|                                                                                         |
|  +-----------------------------------------------------------------------------------+  |
|  | SEVERITY | TITLE / ERROR           | SERVICE    | AI STATUS   | TIME     | ACTION |  |
|  |----------+-------------------------+------------+-------------+----------+--------|  |
|  | CRITICAL | OOMKilled: Max heap limit| auth-serv  | Fix Ready ✨ | 2m ago   | Review |  |
|  | HIGH     | Redis Pool Timeout       | cache-serv | Fix Ready ✨ | 14m ago  | Review |  |
|  | MEDIUM   | JWT Secret Undefined    | gateway    | Approved 🚀 | 1h ago   | View PR|  |
|  | LOW      | Deprecated Header 404    | billing    | Rejected ✖️ | 3h ago   | Closed |  |
|  +-----------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

#### 3.2 Component Details
- **3 KPI Cards:** Built with shadcn/ui `Card`, featuring subtle gradient borders (`hover:border-cyan-500/50 transition-all`).
  - Card 1: `Total Incidents` with an activity pulse icon.
  - Card 2: `Pending Triage` highlighted with an amber glowing dot and count.
  - Card 3: `Resolved / Remediated` highlighted with an emerald badge showing success percentage.
- **Realtime Data Table:** Built with shadcn/ui `Table`, supporting:
  - Interactive row hover effects (`hover:bg-slate-800/60 cursor-pointer`).
  - Pulsing badges for incoming live incidents via Supabase Realtime.
  - Severity Badges: `Badge variant="destructive"` (Critical), `variant="warning"` (High), `variant="secondary"` (Medium).
  - Row click navigates to `/incident/[id]` with Next.js App Router client routing.

---

### 4. Page 2: Incident Detail & Approval (`/incident/[id]`)

#### 4.1 Layout & Split-Screen Wireframe

```
+-----------------------------------------------------------------------------------------+
| < Back to Dashboard   | Incident #INC-8942   [CRITICAL]   Status: PENDING REVIEW        |
+-----------------------------------------------------------------------------------------+
| LEFT PANEL (50%): RAW TERMINAL TELEMETRY   | RIGHT PANEL (50%): GEMINI AI DIAGNOSIS     |
| +----------------------------------------+ | +----------------------------------------+ |
| | > Terminal: auth-service (pod-84f9a)   | | | 🤖 Gemini 1.5 Pro Diagnostic Summary   | |
| | Timestamp: 2026-10-30T13:45:12.890Z    | | | ---------------------------------------| |
| |                                        | | | ROOT CAUSE:                            | |
| | [FATAL ERROR] Node.js process crashed  | | | Unbounded array accumulation in user   | |
| | Javascript heap out of memory.         | | | session handler causing memory leak    | |
| | 1: 0xb79850 node::Abort()              | | | during token refresh cycle.            | |
| | 2: 0xa92f12 v8::internal::V8::Fatal... | | |                                        | |
| | 3: 0xc87d4a v8::internal::Heap::Alloc  | | | IMPACT SEVERITY SCORE: 9.4 / 10        | |
| |    at SessionManager.trackSession      | | | CONFIDENCE: 98%                        | |
| |    (/app/dist/session.js:142:18)       | | |                                        | |
| |    at IncomingMessage.<anonymous>      | | | PROPOSED REMEDIATION:                  | |
| |    (/app/dist/server.js:89:12)         | | | Introduce LRU eviction cache and free  | |
| |                                        | | | session references on socket close.    | |
| |                                        | | |                                        | |
| | [Copy Raw Trace]     [Download JSON]   | | | 📁 Target File: src/auth/session.ts    | |
| |                                        | | | 🌿 Target Branch: hotfix/inc-8942-oom  | |
| |                                        | | |                                        | |
| |                                        | | | CODE PATCH PREVIEW:                    | |
| |                                        | | | ```diff                                | |
| |                                        | | | - const activeUsers = [];              | |
| |                                        | | | + const activeUsers = new LRUCache({   | |
| |                                        | | | +   max: 5000, ttl: 1000 * 60 * 15     | |
| |                                        | | | + });                                  | |
| |                                        | | | ```                                    | |
| +----------------------------------------+ | +----------------------------------------+ |
+-----------------------------------------------------------------------------------------+
| HUMAN-IN-THE-LOOP ACTION DOCK                                                           |
| [Status: Awaiting SRE Decision]                                                         |
|                                                                                         |
|      [ ❌ Reject Recommendation ]              [ ✅ Approve & Open GitHub PR ]           |
+-----------------------------------------------------------------------------------------+
```

#### 4.2 Approved State UI Transformation

When the engineer clicks `Approve & Open GitHub PR`:
1. The button morphs into a loading spinner: `Opening Hotfix PR on GitHub...`.
2. Backend calls the GitHub API and updates Supabase.
3. A success notification (`sonner` toast) fires: `"Pull Request #42 opened successfully!"`.
4. The Action Dock transforms to show:
   ```
   [ ✅ Incident Remediated ]
   GitHub PR: [ https://github.com/enterprise-org/auth-service/pull/42 ↗ ]
   Branch: hotfix/inc-8942-oom | Approved by: Alex Chen at 13:46:02
   ```

---

### 5. Page 3: Settings & Webhook Simulator (`/settings`)

#### 5.1 Purpose for Hackathon Judges
Judges need to verify that AgentOps AI operates autonomously on incoming data streams without requiring external cloud accounts or live production incidents during the pitch. The Settings page provides both transparency and an interactive simulation tool.

#### 5.2 Layout Wireframe

```
+-----------------------------------------------------------------------------------------+
| Settings & Integration Control                                                          |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  INGESTION WEBHOOK CONFIGURATION                                                        |
|  Share this webhook URL with external logging systems (Datadog, CloudWatch, Sentry)     |
|  +-----------------------------------------------------------------------------------+  |
|  | https://agentops-ai.vercel.app/api/webhooks/incident               [Copy URL 📋]  |  |
|  +-----------------------------------------------------------------------------------+  |
|  cURL Sample:                                                                           |
|  $ curl -X POST https://agentops-ai.vercel.app/api/webhooks/incident \                 |
|    -H "Content-Type: application/json" -d '{"raw_log": "...", "service": "auth"}'      |
|                                                                                         |
|  -------------------------------------------------------------------------------------  |
|                                                                                         |
|  LIVE INCIDENT SIMULATOR (JUDGE DEMO SUITE)                                             |
|  Click any preset below to simulate an incoming production incident in real time:       |
|                                                                                         |
|  [⚡ Preset 1: Node.js Memory Leak (OOM)]      [⚡ Preset 2: Postgres Deadlock]          |
|  [⚡ Preset 3: Redis Connection Timeout]       [⚡ Preset 4: Unhandled JWT Secret Nil]   |
|                                                                                         |
|  CUSTOM RAW LOG PAYLOAD INJECTOR:                                                       |
|  +-----------------------------------------------------------------------------------+  |
|  | Service Name: [ payment-gateway              ]  Environment: [ Production-US-East]|  |
|  | Raw Error Stack Trace:                                                            |  |
|  | +-------------------------------------------------------------------------------+ |  |
|  | | Error: Connection pool exhausted at Pool.connect (/app/db.js:45)              | |  |
|  | | Timeout awaiting connection for 30000ms                                       | |  |
|  | +-------------------------------------------------------------------------------+ |  |
|  |                                                                                   |  |
|  | [ 🚀 Dispatch Simulated Incident to Webhook ]                                    |  |
|  +-----------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

---

### 6. Page 4: Analytics & Business ROI Dashboard (`/analytics`)

#### 6.1 Objective & Metrics
Demonstrate quantified enterprise business value to judges using interactive charts powered by `Recharts`:
1. **MTTR Reduction:** Average resolution time before AI (45 min) vs. after AI (1.5 min).
2. **Engineer Hours Reclaimed:** Aggregated hours saved per week/incident type.
3. **Resolution Ratio:** Percentage of incidents automated vs. rejected or manually handled.
4. **Severity Distribution:** Critical vs. High vs. Medium breakdown.

#### 6.2 Layout Wireframe

```
+-----------------------------------------------------------------------------------------+
| Analytics & Operations ROI                                                              |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  +-------------------+  +-------------------+  +-------------------+  +---------------+ |
|  | MTTR REDUCTION    |  | ENG HOURS SAVED   |  | AUTO FIX RATE     |  | COST SAVED    | |
|  |  45m -> 1.5m      |  |     342 hrs       |  |      89.4%        |  |   $34,200     | |
|  |  96.7% Faster     |  |  This Month       |  |  Approved PRs     |  |  Est. Impact  | |
|  +-------------------+  +-------------------+  +-------------------+  +---------------+ |
|                                                                                         |
|  CHART 1: MANUAL HOURS SAVED BY AI OVER TIME (Area/Bar Chart)                           |
|  +-----------------------------------------------------------------------------------+  |
|  | [ Hours Saved ]                                                                   |  |
|  |  80 |               ╭──╮                                                          |  |
|  |  60 |         ╭─────╯  ╰──╮                                                       |  |
|  |  40 |   ╭─────╯           ╰───╮                                                   |  |
|  |  20 | ──╯                     ╰─────                                              |  |
|  |   0 +---------------------------------                                            |  |
|  |      Week 1    Week 2    Week 3    Week 4                                         |  |
|  +-----------------------------------------------------------------------------------+  |
|                                                                                         |
|  CHART 2: RESOLUTION DISTRIBUTION          CHART 3: INCIDENTS BY SEVERITY               |
|  (Donut Chart: Recharts PieChart)          (Stacked Bar Chart: Recharts BarChart)       |
|  +------------------------------------+    +------------------------------------+       |
|  |    ● Approved & Merged (82%)       |    | [■ Critical ■ High ■ Medium ■ Low] |       |
|  |    ● Pending Review (10%)          |    | 40|  █     █                       |       |
|  |    ● Rejected by SRE (8%)          |    | 20|  █  █  █  █                    |       |
|  |                                    |    |  0+----------------------------    |       |
|  |        [ 82% Automated ]           |    |    Auth  Pay  DB  API              |       |
|  +------------------------------------+    +------------------------------------+       |
+-----------------------------------------------------------------------------------------+
```

---

### 7. Component Library & shadcn/ui Specs

| Component | Usage & Customization |
| :--- | :--- |
| `Button` | Variants: `default` (indigo), `destructive` (red-500), `outline` (slate-700), `emerald` (custom approve button with glow). |
| `Badge` | Variants: `critical` (bg-red-500/20 text-red-400), `pending` (bg-purple-500/20 text-purple-400), `approved` (bg-emerald-500/20 text-emerald-400). |
| `Card` | Glassmorphism surface: `bg-slate-900/80 backdrop-blur border-slate-800`. |
| `Table` | High-density data view with sticky header and alternating row hover transitions. |
| `ScrollArea` | Custom dark scrollbars for the raw terminal error log. |
| `Sonner` | Enterprise rich-toast provider for instant user feedback upon approval/rejection. |
| `Tabs` | Switch between "Code Diff", "Full AI Explanation", and "Raw JSON" on detail view. |

