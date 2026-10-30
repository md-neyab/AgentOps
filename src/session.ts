// Auto-generated remediation patch by AgentOps AI
// File: src/session.ts

--- a/src/session.ts
+++ b/src/session.ts
@@ -1,5 +1,6 @@
 import { EventEmitter } from 'events';
+import { LRU } from 'lru-cache';
 
 export interface SessionData {
   id: string;
@@ -10,10 +11,15 @@ export interface SessionData {
   createdAt: number;
 }
 
 export class SessionStore extends EventEmitter {
-  private sessions: Map<string, SessionData> = new Map();
+  private sessions: LRU<string, SessionData>;
   private readonly maxSessions: number;
   private readonly ttlMs: number;
 
   constructor(options: { maxSessions?: number; ttlMs?: number } = {}) {
     super();
     this.maxSessions = options.maxSessions ?? 10000;
     this.ttlMs = options.ttlMs ?? 3600000;
+    this.sessions = new LRU<string, SessionData>({
+      max: this.maxSessions,
+      ttl: this.ttlMs,
+      dispose: (value) => this.emit('session:expired', value)
+    });
   }
 
   setSession(session: SessionData): void {
-    this.sessions.set(session.id, session);
+    this.sessions.set(session.id, session);
     this.emit('session:set', session);
   }
 
   getSession(id: string): SessionData | undefined {
     return this.sessions.get(id);
   }
 
   deleteSession(id: string): boolean {
-    return this.sessions.delete(id);
+    return this.sessions.delete(id);
   }
 
   clear(): void {
     this.sessions.clear();
   }
 
   get size(): number {
     return this.sessions.size;
   }
 }

