// Auto-generated remediation patch by AgentOps AI
// File: src/auth-service/session-cache.ts

@@ -12,3 +12,5 @@
-const activeSessions: Session[] = [];
+import { LRUCache } from 'lru-cache';
+const activeSessions = new LRUCache({ max: 5000, ttl: 1000 * 60 * 15 });
