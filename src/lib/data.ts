/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './supabase';
import { mockProjects, mockTasks, mockInboxMessages, mockIntegrations } from './mockData';
import type { Project, Task, InboxMessage, Integration, BillingProfile, ContractDetails } from './types';

// Set strictly to false only if explicitly configured as 'false'
const useMockData = process.env.NEXT_PUBLIC_USE_MOCKS !== 'false';

console.log('CTE Flow Financeiro - Supabase Connection Status:', {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  useMocksEnv: process.env.NEXT_PUBLIC_USE_MOCKS,
  useMockData,
  supabaseClientExists: !!supabase
});

function mapBillingProfile(bp: any): BillingProfile | null {
  if (!bp) return null;
  return {
    id: bp.id,
    projectId: bp.project_id,
    measurementDates: bp.measurement_dates || 'Dia 20 de cada mês',
    billingDates: bp.billing_dates || 'D+5 após aprovação',
    docsRequired: bp.docs_required || 'Nota Fiscal, CND, GFIP',
    isNewClient: bp.is_new_client ?? true,
    notes: bp.notes || '',
  };
}

function mapContractDetails(cd: any): ContractDetails | null {
  if (!cd) return null;
  return {
    id: cd.id,
    projectId: cd.project_id,
    documentUrl: cd.document_url || '',
    renewalDate: cd.renewal_date || '',
    index: cd.index || 'INCC-M',
    expectedReturnDate: cd.expected_return_date || '',
    lastFupDate: cd.last_fup_date || '',
    status: cd.status || 'pending_client',
    originalValue: cd.original_value ? Number(cd.original_value) : 0,
    readjustedValue: cd.readjusted_value ? Number(cd.readjusted_value) : 0,
  };
}

function mapProject(p: any): Project {
  return {
    id: p.id,
    name: p.name,
    color: p.color || '#004d6d',
    responsible: p.responsible || '',
    email: p.email || '',
    client: p.client || '',
    area: p.area || '',
    owner: p.owner || '',
    label_code: p.label_code || '',
    folder: p.folder || '3. Projetos Ativos | Desenvolvimento',
    contract_original_value: p.contract_original_value ? Number(p.contract_original_value) : 0,
    contract_aditivo_value: p.contract_aditivo_value ? Number(p.contract_aditivo_value) : 0,
    navis_launched_value: p.navis_launched_value ? Number(p.navis_launched_value) : 0,
    reajuste_adicional_value: p.reajuste_adicional_value ? Number(p.reajuste_adicional_value) : 0,
    contracted_value: p.contracted_value ? Number(p.contracted_value) : 0,
    margin_pct: p.margin_pct ? Number(p.margin_pct) : 0,
    total_planned_value: p.total_planned_value ? Number(p.total_planned_value) : 0,
    flow_date: p.flow_date || '',
    billing_day: p.billing_day ? Number(p.billing_day) : 20,
    approved_by_owner: p.approved_by_owner ?? false,
    is_critical: p.is_critical ?? false,
    tasks_total: p.tasks_total ? Number(p.tasks_total) : 0,
    created_at: p.created_at,
    billing_profile: p.billing_profiles ? mapBillingProfile(Array.isArray(p.billing_profiles) ? p.billing_profiles[0] : p.billing_profiles) : null,
    contract_details: p.contract_details ? mapContractDetails(Array.isArray(p.contract_details) ? p.contract_details[0] : p.contract_details) : null,
  };
}

function mapTask(t: any): Task {
  return {
    id: t.id,
    project_id: t.project_id,
    name: t.name,
    description: t.description || '',
    value: t.value ? Number(t.value) : 0,
    status: t.status as Task['status'],
    responsible: t.responsible || '',
    email: '', // Default fallback since it's not present in db schema
    due_date: t.due_date,
    created_at: t.created_at,
    etapa: t.etapa || '',
    navis_num: t.navis_num || '',
    status_nf: t.status_nf || 'nenhum',
    pagamento: t.pagamento || 'nenhum',
    date_previous: t.date_previous,
    value_previous: t.value_previous ? Number(t.value_previous) : null,
    gap_justification: t.gap_justification,
    launch_navis: t.launch_navis || 'Lançar',
  };
}

export async function fetchProjects(): Promise<Project[]> {
  if (useMockData) {
    return mockProjects;
  }

  if (!supabase) {
    throw new Error('Supabase client is not initialized. Please verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env file.');
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*, billing_profiles:billing_profiles(*), contract_details:contract_details(*)')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Supabase projects fetch failed:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw error;
  }
  return (data ?? []).map(mapProject);
}

export async function fetchTasks(): Promise<Task[]> {
  if (useMockData) {
    return mockTasks;
  }

  if (!supabase) {
    throw new Error('Supabase client is not initialized. Please verify your credentials.');
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Supabase tasks fetch failed:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw error;
  }
  return (data ?? []).map(mapTask);
}

export async function fetchTasksByProject(projectId: string): Promise<Task[]> {
  if (useMockData) {
    return mockTasks.filter((task) => task.project_id === projectId);
  }

  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Supabase tasksByProject fetch failed:', error);
    throw error;
  }
  return (data ?? []).map(mapTask);
}

export async function updateTaskStatus(taskId: string, status: Task['status']): Promise<void> {
  if (useMockData) {
    const task = mockTasks.find((t) => t.id === taskId);
    if (task) task.status = status;
    return;
  }

  if (!supabase) throw new Error('Supabase client is not initialized.');

  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId);
  if (error) {
    console.error('Supabase updateTaskStatus failed:', error);
    throw error;
  }
}

export async function fetchInboxMessages(): Promise<InboxMessage[]> {
  if (useMockData) {
    return mockInboxMessages;
  }

  if (!supabase) throw new Error('Supabase client is not initialized.');

  const { data, error } = await supabase
    .from('inbox_messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase inbox fetch failed:', error);
    throw error;
  }
  return data ?? [];
}

export async function markMessageRead(id: string): Promise<void> {
  if (useMockData) {
    const message = mockInboxMessages.find((msg) => msg.id === id);
    if (message) message.read = true;
    return;
  }

  if (!supabase) throw new Error('Supabase client is not initialized.');

  const { error } = await supabase
    .from('inbox_messages')
    .update({ read: true })
    .eq('id', id);
  if (error) {
    console.error('Supabase markMessageRead failed:', error);
    throw error;
  }
}

export async function fetchIntegrations(): Promise<Integration[]> {
  if (useMockData) {
    return mockIntegrations;
  }

  if (!supabase) throw new Error('Supabase client is not initialized.');

  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Supabase integrations fetch failed:', error);
    throw error;
  }
  return data ?? [];
}

export async function saveBillingProfile(profile: Partial<BillingProfile> & { projectId: string }): Promise<void> {
  if (useMockData) {
    const proj = mockProjects.find(p => p.id === profile.projectId);
    if (proj) {
      proj.billing_profile = {
        id: profile.id || 'BP-NEW',
        projectId: profile.projectId,
        measurementDates: profile.measurementDates || 'Dia 20 de cada mês',
        billingDates: profile.billingDates || 'D+5 após aprovação',
        docsRequired: profile.docsRequired || 'Nota Fiscal, CND, GFIP',
        isNewClient: profile.isNewClient ?? true,
        notes: profile.notes || '',
      };
    }
    return;
  }

  if (!supabase) throw new Error('Supabase client is not initialized.');

  const dbData = {
    project_id: profile.projectId,
    measurement_dates: profile.measurementDates,
    billing_dates: profile.billingDates,
    docs_required: profile.docsRequired,
    is_new_client: profile.isNewClient,
    notes: profile.notes,
  };

  const { error } = await supabase
    .from('billing_profiles')
    .upsert(dbData, { onConflict: 'project_id' });
  
  if (error) {
    console.error('Failed to save billing profile:', error);
    throw error;
  }
}

export function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
}
