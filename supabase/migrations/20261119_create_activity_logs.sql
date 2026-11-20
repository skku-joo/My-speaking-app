-- 1. Create public.activity_logs table to store listening & shadowing activity records with timestamp
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_key UUID NOT NULL,
  listen_count INTEGER DEFAULT 0 NOT NULL CHECK (listen_count >= 0),
  shadowing_count INTEGER DEFAULT 0 NOT NULL CHECK (shadowing_count >= 0),
  completed_turns INTEGER DEFAULT 0 NOT NULL CHECK (completed_turns >= 0),
  topic TEXT DEFAULT 'My Self-Introduction' NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT activity_logs_user_session_unique UNIQUE (user_id, session_key)
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_recorded_at
  ON public.activity_logs (user_id, recorded_at DESC);

-- 2. Explicit GRANTs for PostgREST API (anon & authenticated)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.activity_logs TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (authenticated users only)
DROP POLICY IF EXISTS "Authenticated users can select own activity logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can select own activity logs"
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert own activity logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can insert own activity logs"
  ON public.activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can update own activity logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can update own activity logs"
  ON public.activity_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can delete own activity logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can delete own activity logs"
  ON public.activity_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
