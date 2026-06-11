/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './supabase';
import { mockProjects, mockTasks, mockInboxMessages, mockIntegrations } from './mockData';
import type { Project, Task, TaskStatus, InboxMessage, Integration, BillingProfile, ContractDetails, PreviousFlowRow, RawTaskRow, ReajusteHistory } from './types';

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
    reajustePct: cd.reajuste_pct ? Number(cd.reajuste_pct) : 0,
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
    flow_released: p.flow_released ?? false,
    flow_released_at: p.flow_released_at || null,
    flow_review_requested: p.flow_review_requested ?? false,
    flow_review_requested_at: p.flow_review_requested_at || null,
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
    project_id: t.projeto_id || t.project_id,
    name: t.atividade || t.name,
    description: '',
    value: t.valor ? Number(t.valor) : 0,
    status: mapTaskStatus(t.status_nf),
    responsible: '',
    email: '',
    due_date: t.data_conclusao_atividade || t.data_conclusao || t.data || t.due_date,
    created_at: t.created_at || new Date().toISOString(),
    etapa: t.etapa || '',
    navis_num: t.numero_navis || t.navis_num || '',
    status_nf: t.status_nf || '—',
    pagamento: t.pagamento || '—',
    date_previous: t.data_anterior || t.date_previous,
    value_previous: t.valor_anterior ? Number(t.valor_anterior) : null,
    gap_justification: t.justificativa_gap || t.gap_justification,
    launch_navis: t.lancar_navis === 'Não Lançar' ? 'Não Lançar' : 'Lançar',
    month_reference: t.mes_referencia,
    line_color: t.cor_linha || t.line_color,
    change_indicator: t.indicador_mudanca || t.change_indicator,
    text_style: t.estilo_texto || t.text_style,
    additive_type: t.tipo_aditivo || t.additive_type,
    new_flag: t.flag_novo || t.new_flag,
  };
}

function normalizeLaunchNavis(value: unknown): 'Lançar' | 'Não Lançar' {
  const text = String(value ?? '').trim();
  return text === 'Não Lançar' || text === 'Nao Lancar' ? 'Não Lançar' : 'Lançar';
}

function mapPreviousFlowRow(row: any): PreviousFlowRow {
  return {
    id: row.id,
    project_id: row.projeto_id || row.project_id,
    month: row.mes_referencia || row.snapshot_month || '',
    etapa: row.etapa || '',
    atividade: row.atividade || row.name || '',
    navis_num: row.numero_navis || row.navis_num || '',
    value: Number(row.valor ?? row.value ?? 0),
    date: row.data || row.due_date || null,
    status_nf: row.status_nf || '—',
    pagamento: row.pagamento || '—',
    date_previous: row.data_anterior || row.date_previous || null,
    value_previous: row.valor_anterior != null ? Number(row.valor_anterior) : row.value_previous != null ? Number(row.value_previous) : null,
    gap_justification: row.justificativa_gap || row.gap_justification || null,
    launch_navis: normalizeLaunchNavis(row.lancar_navis || row.launch_navis),
  };
}

function mapRawTaskRow(row: any): RawTaskRow {
  const contracted = row.valor_contratado ?? row.contracted_value;
  const planned = row.valor_planejado ?? row.valor ?? row.value ?? row.planned_value;
  return {
    id: row.id,
    project_id: row.projeto_id || row.project_id,
    name: row.nome || row.atividade || row.name || '',
    start_date: row.data_inicial || row.start_date || null,
    due_date: row.vencimento || row.data_conclusao || row.due_date || null,
    gap: row.gap || row.gap_justification || null,
    status: row.status || row.status_nf || '',
    responsible: row.responsavel || row.responsible || row.owner || '',
    contracted_value: contracted != null ? Number(contracted) : null,
    planned_value: planned != null ? Number(planned) : null,
    difference: row.diferenca != null ? Number(row.diferenca) : row.diferenca_valor_wrike != null ? Number(row.diferenca_valor_wrike) : contracted != null && planned != null ? Number(contracted) - Number(planned) : null,
    consultant_hours: row.consultor != null ? Number(row.consultor) : row.horas_consultor != null ? Number(row.horas_consultor) : null,
    analyst_hours: row.analista != null ? Number(row.analista) : row.horas_analista != null ? Number(row.horas_analista) : null,
    intern_hours: row.estagiario != null ? Number(row.estagiario) : row.horas_estagiario != null ? Number(row.horas_estagiario) : null,
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

  const projects = (data ?? []).map(mapProject);

  // Attempt to load contract details separately
  if (supabase && projects.length > 0) {
    try {
      const { data: contractData } = await supabase
        .from('contract_details')
        .select('*');
      
      if (contractData) {
        projects.forEach(p => {
          const contract = contractData.find(c => c.project_id === p.id);
          if (contract) p.contract_details = mapContractDetails(contract);
        });
      }
    } catch (e) {
      console.warn('Could not load contract details:', e);
    }
  }

  // Attempt to load billing profiles separately
  if (supabase && projects.length > 0) {
    try {
      const { data: billingData } = await supabase
        .from('billing_profiles')
        .select('*');
      
      if (billingData) {
        projects.forEach(p => {
          const billing = billingData.find(b => b.project_id === p.id);
          if (billing) p.billing_profile = mapBillingProfile(billing);
        });
      }
    } catch (e) {
      console.warn('Could not load billing profiles:', e);
    }
  }

  return projects;
}

export async function fetchTasks(): Promise<Task[]> {
  if (useMockData) {
    return mockTasks;
  }

  if (!supabase) {
    throw new Error('Supabase client is not initialized. Please verify your credentials.');
  }

  // Try the view first, then fall back to fluxo_mes_atual
  const { data: viewData, error: viewError } = await supabase
    .from('view_financial_flow_rows')
    .select('*');

  if (!viewError && viewData) {
    return (viewData ?? []).map(mapTask);
  }

  console.warn('view_financial_flow_rows not found, trying fluxo_mes_atual:', viewError);

  const { data: flowData, error: flowError } = await supabase
    .from('fluxo_mes_atual')
    .select('*');

  if (flowError) {
    console.error('Supabase tasks fetch failed (both views):', viewError, flowError);
    throw flowError;
  }

  return (flowData ?? []).map(mapTask);
}

export async function fetchTasksByProject(projectId: string): Promise<Task[]> {
  if (useMockData) {
    return mockTasks.filter((task) => task.project_id === projectId);
  }

  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  // Try the view first
  const { data: viewData, error: viewError } = await supabase
    .from('view_financial_flow_rows')
    .select('*')
    .eq('project_id', projectId);

  if (!viewError && viewData) {
    return (viewData ?? []).map(mapTask);
  }

  // Fall back to fluxo_mes_atual
  const { data: flowData, error: flowError } = await supabase
    .from('fluxo_mes_atual')
    .select('*')
    .eq('projeto_id', projectId);

  if (!flowError && flowData) {
    return (flowData ?? []).map(mapTask);
  }

  // Fall back to tasks with projeto_id
  const { data: tasksData, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('projeto_id', projectId);

  if (tasksError) {
    console.error('Supabase tasksByProject fetch failed:', viewError, flowError, tasksError);
    throw tasksError;
  }
  return (tasksData ?? []).map(mapTask);
}

export async function fetchPreviousFlowRows(projectId: string): Promise<PreviousFlowRow[]> {
  if (useMockData) {
    return mockTasks
      .filter((task) => task.project_id === projectId)
      .map((task) => mapPreviousFlowRow({
        id: `prev-${task.id}`,
        project_id: task.project_id,
        snapshot_month: task.date_previous ? task.date_previous.slice(0, 7) : '2026-02',
        name: task.name,
        etapa: task.etapa,
        navis_num: task.navis_num,
        value: task.value_previous ?? task.value,
        due_date: task.date_previous ?? task.due_date,
        status_nf: task.status_nf,
        pagamento: task.pagamento,
        gap_justification: task.gap_justification,
        launch_navis: task.launch_navis,
      }));
  }

  if (!supabase) throw new Error('Supabase client is not initialized.');

  const { data, error } = await supabase
    .from('fluxo_mes_anterior')
    .select('*')
    .eq('projeto_id', projectId)
    .order('data', { ascending: true });

  if (!error) return (data ?? []).map(mapPreviousFlowRow);

  const fallback = await supabase
    .from('task_snapshots')
    .select('*')
    .eq('project_id', projectId)
    .order('due_date', { ascending: true });

  if (fallback.error) {
    console.error('Supabase previous flow fetch failed:', error, fallback.error);
    throw fallback.error;
  }

  return (fallback.data ?? []).map(mapPreviousFlowRow);
}

export async function fetchRawTaskRows(projectId: string): Promise<RawTaskRow[]> {
  if (useMockData) {
    return mockTasks
      .filter((task) => task.project_id === projectId)
      .map((task) => mapRawTaskRow({
        id: task.id,
        project_id: task.project_id,
        name: task.name,
        start_date: task.created_at,
        due_date: task.due_date,
        gap_justification: task.gap_justification,
        status: task.status_nf,
        responsible: task.responsible,
        contracted_value: task.value_previous ?? task.value,
        planned_value: task.value,
      }));
  }

  if (!supabase) throw new Error('Supabase client is not initialized.');

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('projeto_id', projectId)
    .order('vencimento', { ascending: true, nullsFirst: false });

  if (!error && (data ?? []).length > 0) return (data ?? []).map(mapRawTaskRow);

  // Fallback with alternative column names
  const fallback = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (!fallback.error && (fallback.data ?? []).length > 0) return (fallback.data ?? []).map(mapRawTaskRow);

  const flowFallback = await supabase
    .from('fluxo_mes_atual')
    .select('*')
    .eq('projeto_id', projectId)
    .order('data', { ascending: true, nullsFirst: false });

  if (flowFallback.error) {
    console.error('Supabase raw tasks fetch failed:', error, fallback.error, flowFallback.error);
    throw flowFallback.error;
  }

  return (flowFallback.data ?? []).map(mapRawTaskRow);
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
  let statusNf = 'Concluído';
  if (action === 'faturado') {
    status = 'Nota Enviada';
    statusNf = 'Nota Enviada';
  }
  if (action === 'pago') {
    status = 'Pago';
    statusNf = 'Pago';
  }

  const { error: taskError } = await supabase
    .from('tasks')
    .update({ status, status_nf: statusNf })
    .eq('project_id', projectId);

  if (taskError) {
    console.error(`Failed to update task statuses for project ${projectId}:`, taskError);
    throw taskError;
  }

  try {
    const { error: eventError } = await supabase
      .from('project_status_events')
      .insert([{ project_id: projectId, action_type: action === 'medido' ? 'measurements_sent' : action === 'faturado' ? 'invoices_sent' : 'paid', actor_name: 'Líder Admin', created_at: new Date().toISOString() }]);
    if (eventError) {
      console.warn('Could not insert project status event, continuing:', eventError);
    }
  } catch (e) {
    console.warn('project_status_events missing or insert failed, ignoring:', e);
  }
}

export async function releaseFlowInDb(projectId: string): Promise<void> {
  if (useMockData) return;
  if (!supabase) throw new Error('Supabase client is not initialized.');

  const { error } = await supabase
    .from('projetos')
    .update({ flow_released: true, flow_released_at: new Date().toISOString() })
    .eq('id', projectId);

  if (error) {
    console.error('Supabase releaseFlowInDb failed:', error);
    throw error;
  }
}

export async function requestFlowReviewInDb(projectId: string): Promise<void> {
  if (useMockData) return;
  if (!supabase) throw new Error('Supabase client is not initialized.');

  const { error } = await supabase
    .from('projetos')
    .update({ flow_review_requested: true, flow_review_requested_at: new Date().toISOString() })
    .eq('id', projectId);

  if (error) {
    console.error('Supabase requestFlowReviewInDb failed:', error);
    throw error;
  }
}

export async function approveFlowInDb(projectId: string): Promise<void> {
  if (useMockData) return;
  if (!supabase) throw new Error('Supabase client is not initialized.');

  const { error } = await supabase
    .from('projetos')
    .update({ fluxo_aprovado: true, data_aprovacao_fluxo: new Date().toISOString() })
    .eq('id', projectId);

  if (error) {
    console.error('Supabase approveFlowInDb failed:', error);
    throw error;
  }

  try {
    const { error: historyError } = await supabase
      .from('historico_aprovacoes')
      .insert([{ projeto_id: projectId, mes_referencia: new Date().toISOString().slice(0, 7), tipo_aprovacao: 'Aprovação de Fluxo', aprovado_por: 'Owner do Projeto', criado_em: new Date().toISOString() }]);
    if (historyError) {
      console.warn('Could not insert flow approval history, continuing:', historyError);
    }
  } catch (e) {
    console.warn('historico_aprovacoes missing or insert failed, ignoring:', e);
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

  const totalOld = items.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const totalNew = items.reduce((sum, item) => {
    const oldVal = Number(item.valor || 0);
    const newVal = Math.round(oldVal * (1 + percentage / 100));
    return sum + newVal;
  }, 0);
  const reajusteValue = totalNew - totalOld;

  for (const item of items) {
    const oldVal = Number(item.valor || 0);
    const newVal = Math.round(oldVal * (1 + percentage / 100));

    const { error: updateError } = await supabase
      .from('fluxo_mes_atual')
      .update({ valor: newVal })
      .eq('id', item.id);

    if (updateError) {
      console.error(`Failed to update reajuste for item ${item.id}:`, updateError);
      throw updateError;
    }
  }

  const { data: projectRecord, error: projectFetchError } = await supabase
    .from('projetos')
    .select('adicional_reajuste, valor_original_contrato, valor_total_aditivado')
    .eq('id', projectId)
    .single();

  if (projectFetchError) {
    console.error('Failed to fetch project reajuste total:', projectFetchError);
    throw projectFetchError;
  }

  const currentReajusteTotal = Number(projectRecord?.adicional_reajuste ?? 0);
  const newReajusteTotal = currentReajusteTotal + reajusteValue;
  const newContractTotal = Number(projectRecord?.valor_original_contrato ?? 0) + Number(projectRecord?.valor_total_aditivado ?? 0) + newReajusteTotal;

  const { error: projectUpdateError } = await supabase
    .from('projetos')
    .update({ adicional_reajuste: newReajusteTotal, valor_total_contrato: newContractTotal })
    .eq('id', projectId);

  if (projectUpdateError) {
    console.error('Failed to update project reajuste total:', projectUpdateError);
    throw projectUpdateError;
  }

  const { error: contractUpdateError } = await supabase
    .from('contract_details')
    .upsert({ project_id: projectId, reajuste_pct: percentage, index: indexName }, { onConflict: 'project_id' });

  if (contractUpdateError) {
    console.warn('Failed to update or upsert contract detail reajuste percentage, continuing if contract_details is absent:', contractUpdateError);
  }

  await recordReajusteHistory(projectId, indexName, percentage, totalOld, reajusteValue, totalNew);
}

export async function recordReajusteHistory(
  projectId: string,
  indexName: string,
  percentage: number,
  originalValue: number,
  reajusteValue: number,
  readjustedValue: number,
): Promise<void> {
  if (useMockData) return;
  if (!supabase) throw new Error('Supabase client is not initialized.');

  const { error } = await supabase
    .from('reajuste_histories')
    .insert([{ project_id: projectId, index_name: indexName, percentage, original_value: originalValue, reajuste_value: reajusteValue, readjusted_value: readjustedValue }]);

  if (error) {
    console.error('Failed to record reajuste history:', error);
    throw error;
  }
}

export async function fetchReajusteHistory(projectId: string): Promise<ReajusteHistory[]> {
  if (useMockData) return [];
  if (!supabase) throw new Error('Supabase client is not initialized.');

  const { data, error } = await supabase
    .from('reajuste_histories')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase reajuste history fetch failed:', error);
    throw error;
  }

  return data ?? [];
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
