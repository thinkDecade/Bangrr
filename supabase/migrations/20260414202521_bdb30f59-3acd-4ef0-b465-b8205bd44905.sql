
-- Agent memory table for Unibase-backed persistent agent state
CREATE TABLE public.agent_memory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name text NOT NULL,
  memory_type text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast agent lookups
CREATE INDEX idx_agent_memory_agent ON public.agent_memory (agent_name);
CREATE INDEX idx_agent_memory_type ON public.agent_memory (agent_name, memory_type);

-- Enable RLS
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;

-- Anyone can read agent memory (public leaderboard/profile data)
CREATE POLICY "Anyone can view agent memory"
  ON public.agent_memory FOR SELECT
  USING (true);

-- Only service role / DB functions can write (agents write via security definer functions)
-- No direct INSERT/UPDATE/DELETE for regular users

-- Function to upsert agent memory (called from agent cycle)
CREATE OR REPLACE FUNCTION public.upsert_agent_memory(
  _agent_name text,
  _memory_type text,
  _content jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO agent_memory (agent_name, memory_type, content, updated_at)
  VALUES (_agent_name, _memory_type, _content, now())
  ON CONFLICT (agent_name, memory_type)
    DO UPDATE SET content = _content, updated_at = now();
END;
$$;

-- Add unique constraint for upsert
ALTER TABLE public.agent_memory ADD CONSTRAINT agent_memory_agent_type_unique UNIQUE (agent_name, memory_type);
