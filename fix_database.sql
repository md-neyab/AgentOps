-- ==============================================================================
-- AgentOps AI - Supabase Database Fix & Repair Script
-- Run this entire script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Create table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'Untitled Incident',
    service VARCHAR(100) DEFAULT 'unknown-service',
    service_name VARCHAR(100) DEFAULT 'unknown-service',
    environment VARCHAR(50) DEFAULT 'production',
    severity VARCHAR(50) DEFAULT 'high',
    status VARCHAR(50) DEFAULT 'pending',
    stack_trace TEXT DEFAULT '',
    raw_log TEXT DEFAULT '',
    resolved_at TIMESTAMPTZ DEFAULT NULL,
    action_taken TEXT DEFAULT NULL,
    executed_command TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    approved_at TIMESTAMPTZ DEFAULT NULL,
    rejected_at TIMESTAMPTZ DEFAULT NULL,
    ai_analysis JSONB DEFAULT NULL,
    suggested_action JSONB DEFAULT NULL,
    multi_agent_workflow JSONB DEFAULT NULL,
    pr_url TEXT DEFAULT NULL,
    pr_number INTEGER DEFAULT NULL,
    pr_branch TEXT DEFAULT NULL
);

-- 2. Safely add any missing columns if table already existed
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS service VARCHAR(100) DEFAULT 'unknown-service';
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS service_name VARCHAR(100) DEFAULT 'unknown-service';
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS stack_trace TEXT DEFAULT '';
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS raw_log TEXT DEFAULT '';
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS environment VARCHAR(50) DEFAULT 'production';
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS severity VARCHAR(50) DEFAULT 'high';
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS action_taken TEXT DEFAULT NULL;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS executed_command TEXT DEFAULT NULL;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT NULL;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS suggested_action JSONB DEFAULT NULL;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS multi_agent_workflow JSONB DEFAULT NULL;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS pr_url TEXT DEFAULT NULL;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS pr_number INTEGER DEFAULT NULL;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS pr_branch TEXT DEFAULT NULL;

-- 3. Synchronize duplicate naming columns for existing records
UPDATE public.incidents SET service = service_name WHERE service IS NULL AND service_name IS NOT NULL;
UPDATE public.incidents SET service_name = service WHERE service_name IS NULL AND service IS NOT NULL;
UPDATE public.incidents SET stack_trace = raw_log WHERE stack_trace IS NULL AND raw_log IS NOT NULL;
UPDATE public.incidents SET raw_log = stack_trace WHERE raw_log IS NULL AND stack_trace IS NOT NULL;

-- 4. Turn off Row Level Security (RLS) to prevent API permission blocks
ALTER TABLE public.incidents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS incidents DISABLE ROW LEVEL SECURITY;

-- 5. Grant full access permissions to API roles
GRANT ALL ON TABLE public.incidents TO anon, authenticated, service_role, postgres;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 6. Add to Supabase Realtime publication for instant UI updates
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;

-- 7. High-Performance Indexing
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents (severity);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents (created_at DESC);

