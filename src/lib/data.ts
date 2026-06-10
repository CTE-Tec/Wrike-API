/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './supabase';
import { mockProjects, mockTasks, mockInboxMessages, mockIntegrations } from './mockData';
import type { Project, Task, TaskStatus, InboxMessage, Integration, BillingProfile, ContractDetails } from './types';

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
  // Compute is_critical dynamically to match the database view logic:
  // critical = NOT fluxo_aprovado AND dia_medicao IS NOT NULL AND today >= (dia_medicao - 2)
  const today = new Date().getDate();
  const isCritical = !p.fluxo_aprovado && p.dia_medicao != null && today >= (Number(p.dia_medicao) - 2);

  return {
    id: p.id,
    name: p.nome_projeto,
    color: p.color || '#004d6d',
    responsible: p.coordenador || '',
    email: p.email || '',
    client: p.cliente || '',
    area: p.area || '',
    owner: p.owner || '',
    label_code: p.rotulo_1 || '',
    folder: p.folder || '3. Projetos Ativos | Desenvolvimento',
    contract_original_value: p.valor_original_contrato ? Number(p.valor_original_contrato) : 0,
    contract_aditivo_value: p.valor_total_aditivado ? Number(p.valor_total_aditivado) : 0,
    navis_launched_value: p.valor_lancado_navis ? Number(p.valor_lancado_navis) : 0,
    reajuste_adicional_value: p.adicional_reajuste ? Number(p.adicional_reajuste) : 0,
    contracted_value: p.valor_total_contrato ? Number(p.valor_total_contrato) : 0,
    margin_pct: p.margem_percentual ? Number(p.margem_percentual) * 100 : 0,
    total_planned_value: p.valor_total_contrato ? Number(p.valor_total_contrato) : 0,
    flow_date: p.dia_medicao ? `Dia ${p.dia_medicao}` : '',
    billing_day: p.dia_medicao ? Number(p.dia_medicao) : 20,
    approved_by_owner: p.fluxo_aprovado ?? false,
    is_critical: isCritical,
    tasks_total: 0,
    created_at: p.created_at,
    billing_profile: p.billing_profiles ? mapBillingProfile(Array.isArray(p.billing_profiles) ? p.billing_profiles[0] : p.billing_profiles) : null,
    contract_details: p.contract_details ? mapContractDetails(Array.isArray(p.contract_details) ? p.contract_details[0] : p.contract_details) : null,
  };
}

function mapTaskStatus(statusNf: string | null): TaskStatus {
  if (!statusNf) return 'fat';
  const s = statusNf.trim();
  if (s === 'Pago') return 'apr';
  if (s === 'Nota Enviada') return 'vis';
  if (s === 'Enviar Nota') return 'agu';
  if (s === 'Concluído') return 'fat';
  return 'fat';
}

function mapTask(t: any): Task {
  return {
    id: t.id,
    project_id: t.projeto_id,
    name: t.atividade,
    description: '',
    value: t.valor ? Number(t.valor) : 0,
    status: mapTaskStatus(t.status_nf),
    responsible: '',
    email: '',
    due_date: t.data_conclusao,
    created_at: t.created_at || new Date().toISOString(),
    etapa: t.etapa || '',
    navis_num: t.numero_navis || '',
    status_nf: t.status_nf || '—',
    pagamento: t.pagamento || '—',
    date_previous: t.data_anterior,
    value_previous: t.valor_anterior ? Number(t.valor_anterior) : null,
    gap_justification: t.justificativa_gap,
    launch_navis: t.lancar_navis === 'Não Lançar' ? 'Não Lançar' : 'Lançar',
  };
}

export async function fetchProjects(): Promise<Project[]> {
  if (useMockData) {
    return mockProjects;
  }

  if (!supabase) {
    throw new Error('Supabase client is not initialized. Please verify credentials.');
  }

  const { data, error } = await supabase
    .from('projetos')
    .select('*')
    .order('nome_projeto', { ascending: true });
  
  if (error) {
    console.error('Supabase projects fetch failed:', error);
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
    .from('vw_fluxo_completo')
    .select('*');
  
  if (error) {
    console.error('Supabase tasks fetch failed:', error);
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
    .from('vw_fluxo_completo')
    .select('*')
    .eq('projeto_id', projectId);
  
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

  // Convert React TaskStatus back to database wrike status if needed
  let wrikeStatus = 'Planejado';
  if (status === 'apr') wrikeStatus = 'Pago';
  else if (status === 'vis') wrikeStatus = 'Nota Enviada';
  else if (status === 'agu') wrikeStatus = 'Em andamento';
  else if (status === 'fat') wrikeStatus = 'Concluído';

  const { error } = await supabase
    .from('tasks')
    .update({ status: wrikeStatus })
    .eq('id', taskId);
  if (error) {
    console.error('Supabase updateTaskStatus failed:', error);
    throw error;
  }
}

// Database mutations
export async function updateTaskFieldInDb(taskId: string, field: string, value: any): Promise<void> {
  if (useMockData) return;
  if (!supabase) throw new Error('Supabase client is not initialized.');

  if (field === 'due_date') {
    const { error } = await supabase
      .from('fluxo_mes_atual')
      .update({ data: value ? value : null })
      .eq('id', taskId);
    if (error) throw error;
  } else if (field === 'gap_justification') {
    const { error } = await supabase
      .from('fluxo_mes_atual')
      .update({ justificativa_gap: value })
      .eq('id', taskId);
    if (error) throw error;
  } else if (field === 'status_nf') {
    // 1. Fetch task_id from fluxo_mes_atual
    const { data: fmaData, error: fmaError } = await supabase
      .from('fluxo_mes_atual')
      .select('task_id')
      .eq('id', taskId)
      .single();
    if (fmaError) throw fmaError;
    
    const dbTaskId = fmaData.task_id;
    
    // 2. Map status_nf to status_wrike enum
    let wrikeStatus: string | null = null;
    if (value === 'Pago') wrikeStatus = 'Pago';
    else if (value === 'Nota Enviada') wrikeStatus = 'Nota Enviada';
    else if (value === 'Enviar Nota' || value === 'Concluído') wrikeStatus = 'Concluído';
    
    // 3. Update tasks status
    if (dbTaskId && wrikeStatus) {
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: wrikeStatus })
        .eq('id', dbTaskId);
      if (taskError) throw taskError;
    }
    
    // 4. Update status_nf in fluxo_mes_atual
    const { error: flowError } = await supabase
      .from('fluxo_mes_atual')
      .update({ status_nf: value })
      .eq('id', taskId);
    if (flowError) throw flowError;
  }
}

export async function projectActionInDb(projectId: string, action: 'medido' | 'faturado' | 'pago'): Promise<void> {
  if (useMockData) return;
  if (!supabase) throw new Error('Supabase client is not initialized.');
  
  let status = 'Concluído';
  if (action === 'faturado') status = 'Nota Enviada';
  if (action === 'pago') status = 'Pago';
  
  const { error } = await supabase.rpc('atualizar_status_pagamento', {
    p_projeto_id: projectId,
    p_novo_status: status,
    p_usuario: 'Líder Admin'
  });
  
  if (error) {
    console.error(`RPC atualizar_status_pagamento failed for action ${action}:`, error);
    throw error;
  }
}

export async function approveFlowInDb(projectId: string): Promise<void> {
  if (useMockData) return;
  if (!supabase) throw new Error('Supabase client is not initialized.');
  
  const { error } = await supabase.rpc('aprovar_fluxo_projeto', {
    p_projeto_id: projectId,
    p_tipo: 'Aprovar Fluxo',
    p_usuario: 'Owner do Projeto'
  });
  
  if (error) {
    console.error('RPC aprovar_fluxo_projeto failed:', error);
    throw error;
  }
}

export async function applyReajusteInDb(projectId: string, indexName: string, percentage: number): Promise<void> {
  if (useMockData) return;
  if (!supabase) throw new Error('Supabase client is not initialized.');
  
  const { data: items, error: fetchError } = await supabase
    .from('fluxo_mes_atual')
    .select('id, valor')
    .eq('projeto_id', projectId)
    .eq('etapa', 'Reajuste');
    
  if (fetchError) {
    console.error('Failed to fetch reajuste items:', fetchError);
    throw fetchError;
  }
  
  if (!items || items.length === 0) return;
  
  for (const item of items) {
    const oldVal = Number(item.valor);
    const newVal = Math.round(oldVal * (1 + percentage / 100));
    
    const { error: updateError } = await supabase
      .from('fluxo_mes_atual')
      .update({
        valor: newVal
      })
      .eq('id', item.id);
      
    if (updateError) {
      console.error(`Failed to update reajuste for item ${item.id}:`, updateError);
      throw updateError;
    }
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
