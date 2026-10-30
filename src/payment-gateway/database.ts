// Auto-generated remediation patch by AgentOps AI
// File: src/payment-gateway/database.ts

@@ -8,2 +8,4 @@
-const pool = new Pool({ max: 10 });
+const pool = new Pool({ max: 50, connectionTimeoutMillis: 3000, idleTimeoutMillis: 10000 });
