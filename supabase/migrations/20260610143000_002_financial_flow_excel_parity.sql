/*
  Financial flow parity with the reference Excel workbook.

  Design choice:
  - Keep internal UUID primary keys.
  - Store Wrike IDs in wrike_folder_id / wrike_task_id and upsert by those fields.
  - n8n should stop writing Wrike IDs into projects.id and tasks.id.
*/

-- Existing enum installations may already exist in the live database.
DO $$
BEGIN
  ALTER TYPE task_status_type ADD VALUE IF NOT EXISTS 'sem_previsao';
  ALTER TYPE task_status_type ADD VALUE IF NOT EXISTS 'cancelado';
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Project fields required by the mock UI, n8n, and Excel header area.
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS wrike_folder_id text,
  ADD COLUMN IF NOT EXISTS wrike_permalink text,
  ADD COLUMN IF NOT EXISTS client text,
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS owner text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS label_code text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS flow_date text DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_flow_month date,
  ADD COLUMN IF NOT EXISTS flow_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS contract_original_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contract_aditivo_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS navis_launched_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reajuste_adicional_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin_pct numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_planned_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_day integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS measurement_deadline_day integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS approval_due_day integer NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS approved_by_owner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_critical boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS critical_reason text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_wrike_folder_id
  ON projects (wrike_folder_id)
  WHERE wrike_folder_id IS NOT NULL;

-- Task fields required by the Wrike export, the Excel formulas, and n8n.
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS wrike_task_id text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS etapa text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS navis_num text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS team_code text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS status_nf text NOT NULL DEFAULT 'nenhum',
  ADD COLUMN IF NOT EXISTS pagamento text NOT NULL DEFAULT 'nenhum',
  ADD COLUMN IF NOT EXISTS valor_contratado numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_planejado numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS diferenca_valor_wrike numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS horas_consultor numeric,
  ADD COLUMN IF NOT EXISTS horas_analista numeric,
  ADD COLUMN IF NOT EXISTS horas_estagiario numeric,
  ADD COLUMN IF NOT EXISTS date_previous date,
  ADD COLUMN IF NOT EXISTS value_previous numeric,
  ADD COLUMN IF NOT EXISTS gap_justification text,
  ADD COLUMN IF NOT EXISTS launch_navis text NOT NULL DEFAULT 'Lançar',
  ADD COLUMN IF NOT EXISTS is_aditivo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS aditivo_type text,
  ADD COLUMN IF NOT EXISTS is_novo_faturavel boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_for_month date,
  ADD COLUMN IF NOT EXISTS source_payload jsonb,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_wrike_task_id
  ON tasks (wrike_task_id)
  WHERE wrike_task_id IS NOT NULL;

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks
  ADD CONSTRAINT tasks_status_check
  CHECK (status::text IN ('fat', 'vis', 'agu', 'apr', 'sem_previsao', 'cancelado'))
  NOT VALID;

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_nf_check;
ALTER TABLE tasks
  ADD CONSTRAINT tasks_status_nf_check
  CHECK (status_nf IN (
    'pago', 'nota_enviada', 'enviar_nota', 'concluido', 'nota_atrasada', 'atrasado', 'nenhum',
    'Pago', 'Nota Enviada', 'Enviar Nota', 'Concluído', 'Concluido', 'Nota Atrasada', 'Atrasado', '-', '—'
  ))
  NOT VALID;

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_pagamento_check;
ALTER TABLE tasks
  ADD CONSTRAINT tasks_pagamento_check
  CHECK (pagamento IN ('nota_atrasada', 'atrasado', 'nenhum', 'Nota Atrasada', 'Atrasado', '-', '—'))
  NOT VALID;

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_launch_navis_check;
ALTER TABLE tasks
  ADD CONSTRAINT tasks_launch_navis_check
  CHECK (launch_navis IN ('Lançar', 'Não Lançar', 'Lancar', 'Nao Lancar'))
  NOT VALID;

-- Excel auxiliary table Tabela1: code -> stage.
CREATE TABLE IF NOT EXISTS financial_stage_codes (
  code text PRIMARY KEY,
  stage text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO financial_stage_codes (code, stage) VALUES
  ('1', 'Projeto'),
  ('2', 'Eficiência Energética'),
  ('3', 'Carbono'),
  ('4', 'Materiais'),
  ('5', 'Obras'),
  ('6', 'Operação e Manutenção'),
  ('7', 'Eventos'),
  ('8', 'Sistemas Prediais'),
  ('9', 'Conforto'),
  ('10', 'Acústica'),
  ('RC', 'Rec'),
  ('RE', 'Reajuste'),
  ('RET', 'Retenção'),
  ('RP', 'Repasse'),
  ('TA', 'Taxa')
ON CONFLICT (code) DO UPDATE SET stage = EXCLUDED.stage;

-- Excel helper lists Tabela2 and Tabela4.
CREATE TABLE IF NOT EXISTS financial_status_rules (
  status_label text PRIMARY KEY,
  rule_group text NOT NULL CHECK (rule_group IN ('active_nf', 'inactive_navis')),
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO financial_status_rules (status_label, rule_group) VALUES
  ('Concluído', 'active_nf'),
  ('Nota Enviada', 'active_nf'),
  ('Pago', 'active_nf'),
  ('Sem Previsão', 'inactive_navis'),
  ('Sem previsão', 'inactive_navis'),
  ('Cancelado', 'inactive_navis')
ON CONFLICT (status_label) DO UPDATE SET rule_group = EXCLUDED.rule_group;

-- Monthly approved states: mirror of "Mes Atual" and "Mes Anterior".
CREATE TABLE IF NOT EXISTS project_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  snapshot_month date NOT NULL,
  name text NOT NULL,
  contracted_value numeric NOT NULL DEFAULT 0,
  tasks_total numeric NOT NULL DEFAULT 0,
  contract_original_value numeric NOT NULL DEFAULT 0,
  contract_aditivo_value numeric NOT NULL DEFAULT 0,
  navis_launched_value numeric NOT NULL DEFAULT 0,
  reajuste_adicional_value numeric NOT NULL DEFAULT 0,
  margin_pct numeric NOT NULL DEFAULT 0,
  total_planned_value numeric NOT NULL DEFAULT 0,
  approved_by_owner boolean NOT NULL DEFAULT true,
  approved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, snapshot_month)
);

CREATE TABLE IF NOT EXISTS task_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  snapshot_month date NOT NULL,
  wrike_task_id text,
  name text NOT NULL,
  etapa text NOT NULL DEFAULT '',
  navis_num text NOT NULL DEFAULT '',
  value numeric NOT NULL DEFAULT 0,
  valor_contratado numeric NOT NULL DEFAULT 0,
  valor_planejado numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'fat',
  status_nf text NOT NULL DEFAULT 'nenhum',
  pagamento text NOT NULL DEFAULT 'nenhum',
  due_date date,
  start_date date,
  gap_justification text,
  launch_navis text NOT NULL DEFAULT 'Lançar',
  is_aditivo boolean NOT NULL DEFAULT false,
  is_novo_faturavel boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, snapshot_month)
);

-- Owner approval cycle. Supports "Aprovar Medicao" and "Aprovar Fluxo".
CREATE TABLE IF NOT EXISTS flow_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  approval_month date NOT NULL,
  approval_type text NOT NULL CHECK (approval_type IN ('measurement', 'full')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'approved', 'expired', 'cancelled')),
  owner_name text NOT NULL DEFAULT '',
  owner_email text NOT NULL DEFAULT '',
  approved_by text,
  approved_at timestamptz,
  email_sent_at timestamptz,
  wrike_folder_id text,
  source_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, approval_month, approval_type)
);

-- Project-level buttons: Medicoes enviadas, Notas faturadas, Pago.
CREATE TABLE IF NOT EXISTS project_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('measurements_sent', 'invoices_sent', 'paid')),
  action_month date NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
  actor_name text,
  actor_email text,
  wrike_update_payload jsonb,
  n8n_execution_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Billing profile form, enriched for Receita Federal / new client / additive flow.
CREATE TABLE IF NOT EXISTS billing_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  cnpj text,
  legal_name text,
  client_name text,
  measurement_dates text NOT NULL DEFAULT 'Dia 20 de cada mês',
  billing_dates text NOT NULL DEFAULT 'D+5 após aprovação',
  docs_required text NOT NULL DEFAULT 'Nota Fiscal, CND, GFIP',
  measurement_day integer,
  invoice_day_offset integer,
  is_new_client boolean NOT NULL DEFAULT true,
  is_additive boolean NOT NULL DEFAULT false,
  receita_federal_payload jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE billing_profiles
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS measurement_day integer,
  ADD COLUMN IF NOT EXISTS invoice_day_offset integer,
  ADD COLUMN IF NOT EXISTS is_additive boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS receita_federal_payload jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Contract management panel.
CREATE TABLE IF NOT EXISTS contract_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  document_url text,
  contract_year integer,
  renewal_date date,
  "index" text NOT NULL DEFAULT 'INCC-M' CHECK ("index" IN ('INCC-M', 'IPC', 'IGP-M')),
  expected_return_date date,
  last_fup_date date,
  status text NOT NULL DEFAULT 'pending_client' CHECK (status IN ('pending_client', 'approved', 'review_required')),
  original_value numeric NOT NULL DEFAULT 0,
  readjusted_value numeric NOT NULL DEFAULT 0,
  reajuste_pct numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contract_details
  ADD COLUMN IF NOT EXISTS document_url text,
  ADD COLUMN IF NOT EXISTS contract_year integer,
  ADD COLUMN IF NOT EXISTS renewal_date date,
  ADD COLUMN IF NOT EXISTS "index" text NOT NULL DEFAULT 'INCC-M',
  ADD COLUMN IF NOT EXISTS expected_return_date date,
  ADD COLUMN IF NOT EXISTS last_fup_date date,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending_client',
  ADD COLUMN IF NOT EXISTS original_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS readjusted_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reajuste_pct numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Sync/audit trail for n8n, Wrike, Naves, Receita Federal, and future automations.
CREATE TABLE IF NOT EXISTS integration_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound', 'bidirectional')),
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error', 'partial')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  records_read integer NOT NULL DEFAULT 0,
  records_written integer NOT NULL DEFAULT 0,
  error_message text,
  payload jsonb
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_approved_for_month ON tasks(approved_for_month);
CREATE INDEX IF NOT EXISTS idx_tasks_status_nf ON tasks(status_nf);
CREATE INDEX IF NOT EXISTS idx_task_snapshots_lookup ON task_snapshots(task_id, snapshot_month);
CREATE INDEX IF NOT EXISTS idx_project_snapshots_lookup ON project_snapshots(project_id, snapshot_month);
CREATE INDEX IF NOT EXISTS idx_flow_approvals_lookup ON flow_approvals(project_id, approval_month, approval_type);
CREATE INDEX IF NOT EXISTS idx_project_status_events_lookup ON project_status_events(project_id, action_month);

-- Month-over-month Excel comparison logic.
CREATE OR REPLACE VIEW view_task_comparisons AS
SELECT
  t.id AS task_id,
  t.project_id,
  t.wrike_task_id,
  t.name AS current_name,
  t.value AS current_value,
  t.due_date::date AS current_due_date,
  t.status::text AS current_status,
  t.etapa,
  t.navis_num,
  t.status_nf,
  t.pagamento,
  t.launch_navis,
  COALESCE(prev.name, t.name) AS previous_name,
  COALESCE(prev.value, t.value_previous) AS previous_value,
  COALESCE(prev.due_date, t.date_previous) AS previous_due_date,
  prev.status AS previous_status,
  COALESCE(t.value - COALESCE(prev.value, t.value_previous), 0) AS value_difference,
  CASE
    WHEN COALESCE(prev.due_date, t.date_previous) IS NULL THEN false
    WHEN t.due_date::date <> COALESCE(prev.due_date, t.date_previous) THEN true
    ELSE false
  END AS date_changed,
  CASE
    WHEN COALESCE(prev.value, t.value_previous) IS NULL THEN false
    WHEN t.value <> COALESCE(prev.value, t.value_previous) THEN true
    ELSE false
  END AS value_changed,
  CASE
    WHEN prev.name IS NULL THEN false
    WHEN t.name <> prev.name THEN true
    ELSE false
  END AS name_changed,
  CASE WHEN prev.id IS NULL AND t.date_previous IS NULL AND t.value_previous IS NULL THEN true ELSE false END AS is_new_faturavel,
  CASE
    WHEN COALESCE(prev.due_date, t.date_previous) IS NOT NULL
      AND t.due_date::date <> COALESCE(prev.due_date, t.date_previous)
      AND COALESCE(t.gap_justification, '') = ''
    THEN 'Justificar GAP no Wrike'
    ELSE t.gap_justification
  END AS gap_status
FROM tasks t
LEFT JOIN LATERAL (
  SELECT ts.*
  FROM task_snapshots ts
  WHERE ts.task_id = t.id
    AND ts.snapshot_month < date_trunc('month', CURRENT_DATE)::date
  ORDER BY ts.snapshot_month DESC
  LIMIT 1
) prev ON true;

-- Main financial flow grid, equivalent to the visible B:L table in "Mes Atual".
CREATE OR REPLACE VIEW view_financial_flow_rows AS
SELECT
  p.id AS project_id,
  p.name AS project_name,
  p.owner,
  t.id AS task_id,
  COALESCE(NULLIF(t.etapa, ''), sc.stage, '') AS etapa,
  t.name AS atividade,
  COALESCE(NULLIF(t.navis_num, ''), code.derived_code, '') AS navis_num,
  t.value AS valor,
  t.due_date::date AS data_conclusao_atividade,
  CASE
    WHEN t.status_nf IN ('nenhum', '-', '—', '') AND date_trunc('month', t.due_date::date) = date_trunc('month', CURRENT_DATE)
      THEN 'Enviar Nota'
    ELSE t.status_nf
  END AS status_nf,
  CASE
    WHEN t.pagamento IN ('nenhum', '-', '—', '') AND t.due_date::date < date_trunc('month', CURRENT_DATE)::date AND t.status_nf NOT IN ('pago', 'Pago')
      THEN 'Atrasado'
    ELSE t.pagamento
  END AS pagamento,
  vc.previous_due_date AS data_anterior,
  vc.previous_value AS valor_anterior,
  vc.gap_status AS justificativa_gap,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM financial_status_rules fsr
      WHERE fsr.rule_group = 'inactive_navis'
        AND fsr.status_label = t.status_nf
    ) OR t.status::text IN ('sem_previsao', 'cancelado')
      THEN 'Não Lançar'
    ELSE t.launch_navis
  END AS lancar_navis,
  t.is_aditivo,
  COALESCE(t.aditivo_type,
    CASE
      WHEN p.label_code LIKE 'AC%' THEN 'AC'
      WHEN p.label_code LIKE 'AD%' THEN 'AD'
      ELSE NULL
    END
  ) AS tipo_aditivo,
  vc.date_changed,
  vc.value_changed,
  vc.name_changed,
  vc.is_new_faturavel
FROM tasks t
JOIN projects p ON p.id = t.project_id
LEFT JOIN view_task_comparisons vc ON vc.task_id = t.id
LEFT JOIN LATERAL (
  SELECT (regexp_match(t.name, '\]\s*[^-]+-([A-Z0-9]{2})-'))[1] AS derived_code
) code ON true
LEFT JOIN financial_stage_codes sc
  ON sc.code = COALESCE(NULLIF(t.navis_num, ''), code.derived_code);

-- Dashboard aggregates for current month.
CREATE OR REPLACE VIEW view_monthly_billing_dashboard AS
SELECT
  date_trunc('month', CURRENT_DATE)::date AS billing_month,
  COUNT(DISTINCT p.id) AS total_fluxos,
  COUNT(DISTINCT p.id) FILTER (WHERE p.approved_by_owner) AS fluxos_aprovados,
  COALESCE(SUM(t.value), 0) AS total_previsto,
  COALESCE(SUM(t.value) FILTER (WHERE t.status::text = 'fat' OR t.status_nf IN ('enviar_nota', 'Enviar Nota')), 0) AS total_a_faturar,
  COALESCE(SUM(t.value) FILTER (WHERE t.status::text = 'agu'), 0) AS total_medido,
  COALESCE(SUM(t.value) FILTER (WHERE t.status::text = 'vis' OR t.status_nf IN ('nota_enviada', 'Nota Enviada')), 0) AS total_faturado,
  COALESCE(SUM(t.value) FILTER (WHERE t.status::text = 'apr' OR t.status_nf IN ('pago', 'Pago')), 0) AS total_recebido,
  COALESCE(SUM(t.value) FILTER (WHERE t.status::text IN ('sem_previsao', 'cancelado') OR t.launch_navis IN ('Não Lançar', 'Nao Lancar')), 0) AS total_sem_previsao_cancelado,
  COUNT(*) FILTER (WHERE vc.date_changed OR vc.value_changed) AS parcelas_alteradas
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
  AND t.due_date::date >= date_trunc('month', CURRENT_DATE)::date
  AND t.due_date::date < (date_trunc('month', CURRENT_DATE) + interval '1 month')::date
LEFT JOIN view_task_comparisons vc ON vc.task_id = t.id;

-- RLS for new tables. Existing broad policies should be revisited before production.
DO $$
DECLARE
  tbl text;
  policy_name text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'financial_stage_codes',
    'financial_status_rules',
    'project_snapshots',
    'task_snapshots',
    'flow_approvals',
    'project_status_events',
    'billing_profiles',
    'contract_details',
    'integration_sync_runs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    policy_name := 'Authenticated users can manage ' || tbl;
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = tbl
        AND policyname = policy_name
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
        policy_name,
        tbl
      );
    END IF;
  END LOOP;
END $$;
