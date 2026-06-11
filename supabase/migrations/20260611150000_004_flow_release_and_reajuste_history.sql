-- Add workflow release / review flags and reajuste history storage.

ALTER TABLE IF EXISTS projetos
  ADD COLUMN IF NOT EXISTS flow_released boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flow_released_at timestamptz,
  ADD COLUMN IF NOT EXISTS flow_review_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flow_review_requested_at timestamptz;

CREATE TABLE IF NOT EXISTS reajuste_histories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  index_name text NOT NULL,
  percentage numeric NOT NULL DEFAULT 0,
  original_value numeric NOT NULL DEFAULT 0,
  reajuste_value numeric NOT NULL DEFAULT 0,
  readjusted_value numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reajuste_histories_project_id ON reajuste_histories(project_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'projetos') THEN
    ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projetos' AND policyname = 'Authenticated users can manage projetos'
    ) THEN
      EXECUTE 'CREATE POLICY "Authenticated users can manage projetos" ON projetos FOR ALL TO authenticated USING (true) WITH CHECK (true)';
    END IF;
  END IF;

  ALTER TABLE IF EXISTS reajuste_histories ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reajuste_histories' AND policyname = 'Authenticated users can manage reajuste_histories'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can manage reajuste_histories" ON reajuste_histories FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;
