# Project Agent Guidelines

## Supabase Database & Table Rules

Whenever creating or modifying Supabase/PostgreSQL tables and accessing them via PostgREST API, **always** apply the following rules:

1. **Explicit Role Grants for PostgREST API**
   - Always include explicit `GRANT` SQL statements for both `anon` and `authenticated` roles (e.g., `SELECT`, `INSERT`, `UPDATE`, `DELETE`, and `USAGE, SELECT` on sequences if applicable) so PostgREST API can access the table without permission errors.

2. **Row Level Security (RLS) & Authenticated Policies**
   - Always enable Row Level Security (`ENABLE ROW LEVEL SECURITY`) on every created table.
   - Always write explicit RLS policies so that only `authenticated` users (`TO authenticated`) can read and write rows (e.g., checking `auth.uid()` ownership where applicable).

### Reference SQL Template

```sql
-- 1. Create table
CREATE TABLE IF NOT EXISTS public.example_table (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Explicit GRANTs for PostgREST API (anon & authenticated)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.example_table TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.example_table ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (authenticated users only)
CREATE POLICY "Authenticated users can select"
  ON public.example_table
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert"
  ON public.example_table
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update"
  ON public.example_table
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete"
  ON public.example_table
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```
