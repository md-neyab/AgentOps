// Auto-generated remediation patch by AgentOps AI
// File: src/auth-service/session-cache.ts

@@ -8,3 +8,5 @@
-const cache = new Map();
+import { LRUCache } from 'lru-cache';
+const cache = new LRUCache({ max: 5000, ttl: 1000 * 60 * 10 });
