-- ==============================================================================
-- Supabase Schema for AgentOps AI
-- Execute this script in the Supabase SQL Editor
-- ==============================================================================

-- 1. Create Enums for Incident Lifecycle (Idempotent)
DO $$ BEGIN
    CREATE TYPE incident_severity AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Incidents Table
CREATE TABLE IF NOT EXISTS public.incidents (
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
    
    -- Pull Request & Execution Tracking
    pr_url TEXT DEFAULT NULL,
    pr_number INTEGER DEFAULT NULL,
    pr_branch TEXT DEFAULT NULL,
    executed_command TEXT DEFAULT NULL,
    action_taken TEXT DEFAULT NULL,
    
    -- Audit Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    approved_at TIMESTAMPTZ DEFAULT NULL,
    resolved_at TIMESTAMPTZ DEFAULT NULL,
    rejected_at TIMESTAMPTZ DEFAULT NULL
);

-- 3. High-Performance Indexes for Filtering and Sorting
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents (severity);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents (created_at DESC);

-- 4. Enable Supabase Realtime for Instant UI Updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;

-- 5. Disable RLS for Hackathon Speed
ALTER TABLE public.incidents DISABLE ROW LEVEL SECURITY;

