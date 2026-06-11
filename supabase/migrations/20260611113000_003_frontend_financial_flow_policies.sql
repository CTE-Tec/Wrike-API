-- Allow the authenticated frontend to read the raw Excel/Wrike task mirror
-- and update only the workflow tables it edits from the spreadsheet UI.

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fluxo_mes_atual ENABLE ROW LEVEL SECURITY;
ALTER TABLE fluxo_mes_anterior ENABLE ROW LEVEL SECURITY;
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "frontend_read_tasks" ON tasks;
CREATE POLICY "frontend_read_tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "frontend_update_tasks_status" ON tasks;
CREATE POLICY "frontend_update_tasks_status"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "frontend_read_fluxo_mes_atual" ON fluxo_mes_atual;
CREATE POLICY "frontend_read_fluxo_mes_atual"
  ON fluxo_mes_atual
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "frontend_update_fluxo_mes_atual" ON fluxo_mes_atual;
CREATE POLICY "frontend_update_fluxo_mes_atual"
  ON fluxo_mes_atual
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "frontend_read_fluxo_mes_anterior" ON fluxo_mes_anterior;
CREATE POLICY "frontend_read_fluxo_mes_anterior"
  ON fluxo_mes_anterior
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "frontend_read_projetos" ON projetos;
CREATE POLICY "frontend_read_projetos"
  ON projetos
  FOR SELECT
  TO authenticated
  USING (true);
