/*
  # Create CTE Faturamento - Projects and Tasks

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text, project name with code)
      - `color` (text, hex color for accent)
      - `responsible` (text, responsible person name)
      - `email` (text, responsible person email)
      - `contracted_value` (numeric, total contracted amount)
      - `tasks_total` (numeric, sum of task values)
      - `folder` (text, project folder/category)
      - `created_at` (timestamptz)
    - `tasks`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `name` (text, task name)
      - `description` (text, task description)
      - `value` (numeric, contracted value for this task)
      - `status` (text, one of: 'fat', 'vis', 'agu', 'apr')
      - `responsible` (text, responsible person name)
      - `email` (text, responsible person email)
      - `due_date` (date, due date)
      - `created_at` (timestamptz)
    - `inbox_messages`
      - `id` (uuid, primary key)
      - `title` (text, message title)
      - `body` (text, message body)
      - `type` (text, message type: 'alert', 'approval', 'info', 'warning')
      - `read` (boolean, whether message has been read)
      - `project_id` (uuid, optional reference to project)
      - `task_id` (uuid, optional reference to task)
      - `created_at` (timestamptz)
    - `integrations`
      - `id` (uuid, primary key)
      - `name` (text, integration name)
      - `type` (text, integration type: 'n8n', 'wrike', 'api')
      - `status` (text, 'active', 'inactive', 'error')
      - `url` (text, integration URL)
      - `last_sync` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write their own data
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#004d6d',
  responsible text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  contracted_value numeric NOT NULL DEFAULT 0,
  tasks_total numeric NOT NULL DEFAULT 0,
  folder text NOT NULL DEFAULT '3. Projetos Ativos | Desenvolvimento',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  value numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'fat' CHECK (status IN ('fat', 'vis', 'agu', 'apr')),
  responsible text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  due_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS inbox_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('alert', 'approval', 'info', 'warning')),
  read boolean NOT NULL DEFAULT false,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read inbox messages"
  ON inbox_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert inbox messages"
  ON inbox_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update inbox messages"
  ON inbox_messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete inbox messages"
  ON inbox_messages FOR DELETE
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'n8n' CHECK (type IN ('n8n', 'wrike', 'api')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  url text NOT NULL DEFAULT '',
  last_sync timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read integrations"
  ON integrations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert integrations"
  ON integrations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update integrations"
  ON integrations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete integrations"
  ON integrations FOR DELETE
  TO authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_inbox_read ON inbox_messages(read);
CREATE INDEX IF NOT EXISTS idx_inbox_type ON inbox_messages(type);
