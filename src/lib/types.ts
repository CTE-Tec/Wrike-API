export type TaskStatus = 'fat' | 'vis' | 'agu' | 'apr';

export interface Project {
  id: string;
  name: string;
  color: string;
  responsible: string;
  email: string;
  contracted_value: number;
  tasks_total: number;
  folder: string;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  name: string;
  description: string;
  value: number;
  status: TaskStatus;
  responsible: string;
  email: string;
  due_date: string | null;
  created_at: string;
}

export interface InboxMessage {
  id: string;
  title: string;
  body: string;
  type: 'alert' | 'approval' | 'info' | 'warning';
  read: boolean;
  project_id: string | null;
  task_id: string | null;
  created_at: string;
}

export interface Integration {
  id: string;
  name: string;
  type: 'n8n' | 'wrike' | 'api';
  status: 'active' | 'inactive' | 'error';
  url: string;
  last_sync: string | null;
  created_at: string;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  fat: 'Faturar',
  vis: 'Visualização',
  agu: 'Aguard. Aprovação',
  apr: 'Aprovado',
};

export const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string; border: string }> = {
  fat: { bg: 'rgba(104,189,76,.14)', text: '#4fa832', border: 'rgba(104,189,76,.2)' },
  vis: { bg: 'rgba(0,139,149,.14)', text: '#007a83', border: 'rgba(0,139,149,.2)' },
  agu: { bg: 'rgba(241,90,41,.14)', text: '#d44e1a', border: 'rgba(241,90,41,.2)' },
  apr: { bg: 'rgba(163,76,157,.14)', text: '#8b3f87', border: 'rgba(163,76,157,.2)' },
};

export const CTE_COLORS = {
  cte1: '#002639',
  cte2: '#004d6d',
  cte3: '#58595b',
  cte4: '#939598',
  enredes: '#007a83',
  sustenta: '#4fa832',
  qualtech: '#d44e1a',
  autodoc: '#a81928',
  gerencia: '#8b3f87',
};
