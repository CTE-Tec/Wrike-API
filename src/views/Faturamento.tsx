'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchProjects, fetchTasks, fetchPreviousFlowRows, fetchRawTaskRows, brl, updateTaskFieldInDb, projectActionInDb, approveFlowInDb, applyReajusteInDb } from '../lib/data';
import { showToast } from '../components/Toast';
import type { Project, Task, TaskStatus, PreviousFlowRow, RawTaskRow } from '../lib/types';
import { STATUS_LABELS } from '../lib/types';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { Search, AlertOctagon, Check, FileSpreadsheet } from 'lucide-react';

type WorkbookTab = 'instrucoes' | 'tasks' | 'mes-atual' | 'mes-anterior' | 'planejado';

const workbookTabs: { id: WorkbookTab; label: string }[] = [
  { id: 'instrucoes', label: 'INSTRUÇÕES' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'mes-atual', label: 'Mês Atual' },
  { id: 'mes-anterior', label: 'Mês Anterior' },
  { id: 'planejado', label: 'Planejado x Contratado' },
];

const instructions = [
  'Salvar o último fluxo com data atualizada na pasta do projeto, ou baixar a última versão do fluxo no Autodoc Qualidade quando for a primeira emissão.',
  'Visualizar o projeto no Wrike no formato Table/Tabela. Células sem valor financeiro devem ficar vazias, exceto valores de Reajuste com 0 ou valor do reajuste.',
  'Filtrar atividades por Campos Personalizados > Valor > Tem essa identificação e manter a ordem: Nome, Início, Prazo, GAP, Status, Responsável, Valor Contratado, $ Valor Planejado.',
  'Exportar a tabela do Wrike para Excel e copiar os valores para a aba Tasks sem alterar a ordem das colunas.',
];

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR');
}

function num(value: number | null | undefined): string {
  return value == null ? '—' : value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

export default function Faturamento() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [previousFlowRows, setPreviousFlowRows] = useState<PreviousFlowRow[]>([]);
  const [rawTaskRows, setRawTaskRows] = useState<RawTaskRow[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [activeSheet, setActiveSheet] = useState<WorkbookTab>('mes-atual');
  const [filter, setFilter] = useState<TaskStatus | 'all' | 'critical'>('all');
  const [search, setSearch] = useState('');
  const [showReajusteModal, setShowReajusteModal] = useState(false);
  const [reajusteIndex, setReajusteIndex] = useState<'INCC-M' | 'IPC'>('INCC-M');
  const [reajustePct, setReajustePct] = useState<number>(4.2);

  const load = useCallback(async () => {
    const [p, t] = await Promise.all([fetchProjects(), fetchTasks()]);
    setProjects(p);
    setTasks(t);
    if (p.length > 0 && !selectedProjectId) {
      setSelectedProjectId(p[0].id);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selectedProjectId) return;

    let cancelled = false;

    async function loadWorkbookSheets() {
      try {
        const [previousRows, rawRows] = await Promise.all([
          fetchPreviousFlowRows(selectedProjectId),
          fetchRawTaskRows(selectedProjectId),
        ]);

        if (!cancelled) {
          setPreviousFlowRows(previousRows);
          setRawTaskRows(rawRows);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setPreviousFlowRows([]);
          setRawTaskRows([]);
        }
      }
    }

    loadWorkbookSheets();

    return () => {
      cancelled = true;
    };
  }, [selectedProjectId]);

  const handleUpdateTaskField = async (taskId: string, field: keyof Task, value: Task[keyof Task]) => {
    try {
      await updateTaskFieldInDb(taskId, field, value);
      await load();
      showToast('✏️', 'Atividade atualizada', 'Campo alterado e salvo no Supabase.', 'to');
    } catch (e) {
      console.error(e);
      showToast('❌', 'Erro ao atualizar', 'Não foi possível salvar a alteração.', 'tr');
    }
  };

  const handleProjectAction = async (projectId: string, action: 'medido' | 'faturado' | 'pago') => {
    try {
      await projectActionInDb(projectId, action);
      await load();
      
      const labels = {
        medido: 'Medições enviadas (status atualizado no Wrike)',
        faturado: 'Notas faturadas (faturamento enviado)',
        pago: 'Confirmado pagamento (fluxo concluído)'
      };
      showToast('⚡', 'Ação do Projeto Executada', labels[action], 'tg');
    } catch (e) {
      console.error(e);
      showToast('❌', 'Erro ao executar ação', 'Não foi possível concluir a ação no projeto.', 'tr');
    }
  };

  const handleApproveFlow = async (projectId: string) => {
    try {
      await approveFlowInDb(projectId);
      await load();
      showToast('✅', 'Fluxo Aprovado', 'Líder de projeto aprovou o fluxo completo do mês.', 'tg');
    } catch (e) {
      console.error(e);
      showToast('❌', 'Erro ao aprovar', 'Não foi possível aprovar o fluxo.', 'tr');
    }
  };

  const handleApplyReajuste = async () => {
    try {
      await applyReajusteInDb(selectedProjectId, reajusteIndex, reajustePct);
      await load();
      setShowReajusteModal(false);
      showToast('📈', 'Reajuste Aplicado', `Novos valores recalculados com base no ${reajusteIndex}.`, 'tg');
    } catch (e) {
      console.error(e);
      showToast('❌', 'Erro ao aplicar reajuste', 'Não foi possível recalcular os valores.', 'tr');
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  if (!selectedProject) {
    return <Layout breadcrumb={[{ label: 'Fluxo Financeiro' }]}><div className="p-8">Carregando...</div></Layout>;
  }

  // Filter tasks belonging to current project
  const projectTasks = tasks.filter(t => t.project_id === selectedProject.id);

  const plannedComparisonRows = rawTaskRows.reduce((acc, row) => {
    const sourceDate = row.due_date || row.start_date;
    const month = sourceDate ? sourceDate.slice(0, 7) : 'Sem data';
    const existing = acc.get(month) || { month, planned: 0, contract: selectedProject.contracted_value, differencePct: 0 };
    existing.planned += row.planned_value ?? 0;
    existing.contract = selectedProject.contracted_value;
    existing.differencePct = existing.contract ? 1 - existing.planned / existing.contract + selectedProject.margin_pct / 100 : 0;
    acc.set(month, existing);
    return acc;
  }, new Map<string, { month: string; planned: number; contract: number; differencePct: number }>());

  const plannedRows = Array.from(plannedComparisonRows.values()).sort((a, b) => a.month.localeCompare(b.month));

  // Apply filters
  const filteredTasks = projectTasks.filter(t => {
    if (filter === 'critical') return selectedProject.is_critical;
    if (filter !== 'all' && t.status !== filter) return false;
    if (search) {
      const term = search.toLowerCase();
      return t.name.toLowerCase().includes(term) || t.etapa.toLowerCase().includes(term);
    }
    return true;
  });

  // Calculate totals by stage for the horizontal summary table
  const stages = ['Projeto', 'Eficiência', 'Interiores', 'Materiais', 'Obras', 'Operação', 'Sistemas Prediais', 'Taxas', 'Outros'];
  
  const stageTotals = stages.reduce((acc, stage) => {
    const stageTasks = projectTasks.filter(t => t.etapa === stage);
    const original = stageTasks.reduce((s, t) => s + (t.value_previous || t.value), 0);
    const updated = stageTasks.reduce((s, t) => s + t.value, 0);
    acc[stage] = { original, updated };
    return acc;
  }, {} as Record<string, { original: number; updated: number }>);

  // Totals for horizontal table
  const totalOriginal = Object.values(stageTotals).reduce((s, v) => s + v.original, 0);
  const totalUpdated = Object.values(stageTotals).reduce((s, v) => s + v.updated, 0);

  return (
    <Layout
      breadcrumb={[
        { label: 'Inteligência Artificial | Projetos' },
        { label: 'Financeiro' },
        { label: 'Fluxo Financeiro', active: true },
      ]}
    >
      {/* Critical Flow Alert Banner */}
      {selectedProject.is_critical && (
        <div className="mx-4 mt-4 bg-purple-900/10 border border-purple-500/30 text-purple-200 p-3 rounded-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block animate-ping" />
            <AlertOctagon size={16} className="text-purple-400" />
            <div>
              <span className="font-bold">Atenção Líder Administrativo:</span> Este projeto está próximo da data limite de medição ({selectedProject.flow_date}). Risco de perda de faturamento!
            </div>
          </div>
          <button 
            onClick={() => handleProjectAction(selectedProject.id, 'medido')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded text-xs transition"
          >
            Enviar Medição Agora
          </button>
        </div>
      )}

      {/* Top Project Selector & Quick Stats */}
      <div className="p-4 grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Project Meta Card */}
        <div className="bg-white border border-[var(--border)] rounded-xl p-4 shadow-sm xl:col-span-3">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: selectedProject.color }} />
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">{selectedProject.name}</h2>
                <div className="text-xs text-[var(--muted)]">
                  Cliente: <span className="font-semibold text-[var(--text2)]">{selectedProject.client}</span> | 
                  Rótulo: <span className="font-semibold text-[var(--text2)]">{selectedProject.label_code}</span> | 
                  Owner: <span className="font-semibold text-purple-700">👤 {selectedProject.owner}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <select 
                value={selectedProjectId} 
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-[var(--surface2)] border border-[var(--border2)] rounded px-3 py-1 text-xs outline-none"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button 
                onClick={() => setShowReajusteModal(true)}
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs py-1 px-3 rounded transition"
              >
                Aplicar Reajuste
              </button>
            </div>
          </div>

          {/* Detailed Financial Overview Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-center">
            <div className="bg-[var(--surface2)] p-2 rounded">
              <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Valor Original</div>
              <div className="text-sm font-bold text-[var(--text)]">{brl(selectedProject.contract_original_value)}</div>
            </div>
            <div className="bg-[var(--surface2)] p-2 rounded">
              <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Total Aditivado</div>
              <div className="text-sm font-bold text-[var(--text)]">{brl(selectedProject.contract_aditivo_value)}</div>
            </div>
            <div className="bg-[var(--surface2)] p-2 rounded">
              <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Lançado Navis</div>
              <div className="text-sm font-bold text-teal-700">{brl(selectedProject.navis_launched_value)}</div>
            </div>
            <div className="bg-[var(--surface2)] p-2 rounded">
              <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Adicional Reajuste</div>
              <div className="text-sm font-bold text-[var(--text)]">{brl(selectedProject.reajuste_adicional_value)}</div>
            </div>
            <div className="bg-[var(--surface2)] p-2 rounded">
              <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Margem</div>
              <div className="text-sm font-bold text-amber-700">{selectedProject.margin_pct}%</div>
            </div>
            <div className="bg-purple-900/5 p-2 rounded border border-purple-500/20">
              <div className="text-[10px] uppercase font-bold text-purple-700">Planejado Atual</div>
              <div className="text-sm font-bold text-purple-900">{brl(selectedProject.total_planned_value)}</div>
            </div>
          </div>
        </div>

        {/* Global Flow Action Card */}
        <div className="bg-white border border-[var(--border)] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Aprovações do Fluxo</h3>
            <div className="flex items-center justify-between mb-3 text-xs">
              <span>Status aprovação Líder:</span>
              {selectedProject.approved_by_owner ? (
                <span className="bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded text-[10px]">APROVADO</span>
              ) : (
                <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">PENDENTE</span>
              )}
            </div>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed mb-4">
              O fluxo deve ser validado integralmente pelo owner para disparar as medições subsequentes.
            </p>
          </div>
          <div className="space-y-2">
            {!selectedProject.approved_by_owner && (
              <button 
                onClick={() => handleApproveFlow(selectedProject.id)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-1.5 rounded transition flex items-center justify-center gap-1"
              >
                <Check size={14} /> Aprovar Fluxo Completo
              </button>
            )}
            <div className="grid grid-cols-3 gap-1">
              <button onClick={() => handleProjectAction(selectedProject.id, 'medido')} className="bg-[var(--surface3)] hover:bg-[var(--border2)] text-[10px] font-bold py-1 rounded transition text-center">Medições</button>
              <button onClick={() => handleProjectAction(selectedProject.id, 'faturado')} className="bg-[var(--surface3)] hover:bg-[var(--border2)] text-[10px] font-bold py-1 rounded transition text-center">Faturar</button>
              <button onClick={() => handleProjectAction(selectedProject.id, 'pago')} className="bg-[var(--surface3)] hover:bg-[var(--border2)] text-[10px] font-bold py-1 rounded transition text-center">Confirmar Pg</button>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Stage Summary Table */}
      <div className="mx-4 bg-white border border-[var(--border)] rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="bg-[var(--surface2)] px-4 py-2 text-xs font-bold text-[var(--text2)] border-b border-[var(--border)]">
          Resumo Financeiro por Etapa do Contrato
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-center text-xs">
            <thead>
              <tr className="bg-[var(--surface3)] border-b border-[var(--border2)]">
                <th className="py-2 text-left pl-4 font-bold text-[var(--muted)]">TIPO</th>
                {stages.map(s => (
                  <th key={s} className="py-2 font-bold text-[var(--muted)]">{s.toUpperCase()}</th>
                ))}
                <th className="py-2 font-bold text-[var(--text)]">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2 text-left pl-4 font-semibold text-[var(--text2)]">Original</td>
                {stages.map(s => (
                  <td key={s} className="py-2 text-[var(--text2)]">{brl(stageTotals[s].original)}</td>
                ))}
                <td className="py-2 font-bold text-[var(--text)]">{brl(totalOriginal)}</td>
              </tr>
              <tr>
                <td className="py-2 text-left pl-4 font-semibold text-[var(--text2)]">Atualizado</td>
                {stages.map(s => (
                  <td key={s} className="py-2 text-[var(--text2)]">{brl(stageTotals[s].updated)}</td>
                ))}
                <td className="py-2 font-bold text-teal-700">{brl(totalUpdated)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Excel Workbook Tabs */}
      <div className="mx-4 mb-4 bg-white border border-[var(--border)] rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center gap-1 overflow-x-auto bg-[#eef3f7] px-2 pt-2 border-b border-[var(--border)]">
          {workbookTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSheet(tab.id)}
              className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-bold border border-b-0 rounded-t-md whitespace-nowrap transition ${
                activeSheet === tab.id
                  ? 'bg-white text-[var(--text)] border-[var(--border)]'
                  : 'bg-[#dfe7ee] text-[var(--text2)] border-transparent hover:bg-white/70'
              }`}
            >
              <FileSpreadsheet size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeSheet === 'instrucoes' && (
        <div className="mx-4 bg-white border border-[var(--border)] rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="bg-[#d9ead3] px-4 py-3 border-b border-[var(--border)]">
            <h3 className="text-sm font-black text-[var(--text)]">INSTRUÇÕES DE USO DO FLUXO</h3>
            <p className="text-xs text-[var(--text2)]">Revisão 17 | 19/Setembro/2023</p>
          </div>
          <table className="w-full text-xs">
            <tbody>
              {instructions.map((instruction, index) => (
                <tr key={instruction} className="border-b border-[var(--border)]">
                  <td className="w-24 bg-[#f7fbf4] text-center font-black text-[var(--cte2)]">{String(index + 1).padStart(2, '0')}.</td>
                  <td className="leading-relaxed whitespace-pre-wrap">{instruction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSheet === 'tasks' && (
        <div className="mx-4 bg-white border border-[var(--border)] rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-[1280px] text-xs">
              <thead>
                <tr className="bg-[#d9ead3] border-b border-[var(--border2)]">
                  {['Nome', 'Data inicial', 'Vencimento', 'GAP', 'Status', 'Responsável', 'Valor Contratado', '$ Valor Planejado', 'Diferença $', 'Consultor', 'Analista', 'Estagiário'].map((header) => (
                    <th key={header} className="py-2.5">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawTaskRows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border)] hover:bg-[var(--surface2)]">
                    <td className="min-w-[360px] font-medium">{row.name}</td>
                    <td>{formatDate(row.start_date)}</td>
                    <td>{formatDate(row.due_date)}</td>
                    <td className="min-w-[180px]">{row.gap || ''}</td>
                    <td>{row.status}</td>
                    <td className="min-w-[260px]">{row.responsible}</td>
                    <td className="text-right mono">{row.contracted_value == null ? '' : brl(row.contracted_value)}</td>
                    <td className="text-right mono">{row.planned_value == null ? '' : brl(row.planned_value)}</td>
                    <td className="text-right mono">{row.difference == null ? '' : brl(row.difference)}</td>
                    <td className="text-right mono">{num(row.consultant_hours)}</td>
                    <td className="text-right mono">{num(row.analyst_hours)}</td>
                    <td className="text-right mono">{num(row.intern_hours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSheet === 'mes-anterior' && (
        <div className="mx-4 bg-white border border-[var(--border)] rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] text-xs">
              <thead>
                <tr className="bg-[#d9ead3] border-b border-[var(--border2)]">
                  {['ETAPA', 'ATIVIDADE', 'N.° Navis', 'VALOR', 'DATA', 'STATUS NF', 'PAGAMENTO', 'DATA ANTERIOR', 'VALOR ANTERIOR', 'Justificativa GAP', 'LANÇAR NAVIS'].map((header) => (
                    <th key={header} className="py-2.5">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previousFlowRows.map((row) => (
                  <tr key={row.id} className={`border-b border-[var(--border)] hover:bg-[var(--surface2)] ${row.launch_navis === 'Não Lançar' ? 'opacity-60' : ''}`}>
                    <td className="font-bold">{row.etapa}</td>
                    <td className="min-w-[380px] font-medium">{row.atividade}</td>
                    <td className="text-center mono">{row.navis_num}</td>
                    <td className="text-right mono font-bold">{brl(row.value)}</td>
                    <td className="text-center">{formatDate(row.date)}</td>
                    <td className="text-center">{row.status_nf}</td>
                    <td className="text-center">{row.pagamento === '—' ? '' : row.pagamento}</td>
                    <td className="text-center">{formatDate(row.date_previous)}</td>
                    <td className="text-right mono">{row.value_previous == null ? '' : brl(row.value_previous)}</td>
                    <td className="min-w-[180px]">{row.gap_justification || ''}</td>
                    <td className="text-center font-semibold">{row.launch_navis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSheet === 'planejado' && (
        <div className="mx-4 bg-white border border-[var(--border)] rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="bg-[#d9ead3] px-4 py-2 text-xs font-bold text-[var(--text)] border-b border-[var(--border)]">
            Aba oculta no Excel: Planejado x Contratado
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[760px] text-xs">
              <thead>
                <tr className="bg-[var(--surface3)] border-b border-[var(--border2)]">
                  {['MÊS', 'Valor Planejado', 'Valor Total do Contrato', 'Coluna2', 'Coluna1', 'Diferença %'].map((header) => (
                    <th key={header} className="py-2.5">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plannedRows.map((row) => (
                  <tr key={row.month} className="border-b border-[var(--border)] hover:bg-[var(--surface2)]">
                    <td className="font-bold">{row.month}</td>
                    <td className="text-right mono">{brl(row.planned)}</td>
                    <td className="text-right mono">{brl(row.contract)}</td>
                    <td />
                    <td />
                    <td className="text-right mono font-bold">{(row.differencePct * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSheet === 'mes-atual' && (
      <>
      {/* View Filters toolbar */}
      <div className="vtoolbar mx-4 mb-4 rounded-lg border border-[var(--border)]">
        <div className="flex gap-1 flex-wrap">
          {(['all', 'fat', 'vis', 'agu', 'apr', 'critical'] as const).map((f) => (
            <button
              key={f}
              className={`fchip${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todos' : f === 'critical' ? '⚠️ Fluxos Críticos' : `● ${STATUS_LABELS[f] || f}`}
            </button>
          ))}
        </div>
        <div className="vright">
          <div className="search-box">
            <Search size={12} className="absolute left-[7px] text-[var(--muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar atividade ou etapa…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Excel-like Spreadsheet Table */}
      <div className="mx-4 bg-white border border-[var(--border)] rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[var(--surface3)] border-b border-[var(--border2)]">
                <th className="py-2.5 pl-4 w-28">Etapa</th>
                <th className="py-2.5">Nome da Atividade / Código Equipe</th>
                <th className="py-2.5 text-center w-20">N.º Navis</th>
                <th className="py-2.5 text-right w-28">Valor</th>
                <th className="py-2.5 text-center w-36">Data de Conclusão</th>
                <th className="py-2.5 text-center w-24">Status NF</th>
                <th className="py-2.5 text-center w-32">Pagamento</th>
                <th className="py-2.5 text-center w-28">Data Anterior</th>
                <th className="py-2.5 text-right w-28">Valor Anterior</th>
                <th className="py-2.5 w-40 text-center">Justificativa GAP</th>
                <th className="py-2.5 text-center w-24">Lançar Navis</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => {
                // Formatting classes based on status / index sheet
                const isNewOrReajuste = t.etapa === 'Reajuste';
                const isEnviarNota = t.status_nf === 'Enviar Nota' || t.status === 'fat';
                const isNotLaunched = t.launch_navis === 'Não Lançar';
                
                let rowBg = '';
                if (isNewOrReajuste) rowBg = 'bg-emerald-500/10 hover:bg-emerald-500/15'; // Green row
                else if (isEnviarNota) rowBg = 'bg-cyan-500/10 hover:bg-cyan-500/15'; // Blue row
                else if (isNotLaunched) rowBg = 'opacity-60 bg-gray-50'; // Dimmed row

                return (
                  <tr key={t.id} className={`border-b border-[var(--border)] transition-colors ${rowBg}`}>
                    {/* Etapa */}
                    <td className="py-2 pl-4 font-bold text-[var(--text2)]">{t.etapa}</td>
                    
                    {/* Atividade & Team code label */}
                    <td className="py-2 font-medium">
                      <div className="text-[var(--text)]">{t.name}</div>
                      <div className="text-[10px] text-[var(--muted)]">
                        Equipe: <span className="font-semibold text-sky-800">{t.name.split('-')[3] || '—'}</span>
                      </div>
                    </td>
                    
                    {/* N.º Navis */}
                    <td className="py-2 text-center mono font-semibold">{t.navis_num}</td>
                    
                    {/* Valor */}
                    <td className="py-2 text-right mono font-bold text-emerald-700">{brl(t.value)}</td>
                    
                    {/* Data Conclusão */}
                    <td className="py-2 text-center">
                      <input 
                        type="date"
                        value={t.due_date ? t.due_date.split('T')[0] : ''}
                        onChange={(e) => handleUpdateTaskField(t.id, 'due_date', e.target.value)}
                        className="bg-transparent border border-transparent hover:border-gray-300 rounded px-1 text-[11px] text-center"
                      />
                    </td>
                    
                    {/* Status NF */}
                    <td className="py-2 text-center">
                      <select 
                        value={t.status_nf}
                        onChange={(e) => handleUpdateTaskField(t.id, 'status_nf', e.target.value)}
                        className="bg-transparent border border-transparent hover:border-gray-300 rounded text-[11px]"
                      >
                        <option value="—">—</option>
                        <option value="Pago">Pago</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Nota Enviada">Nota Enviada</option>
                        <option value="Enviar Nota">Enviar Nota</option>
                      </select>
                    </td>
                    
                    {/* Pagamento */}
                    <td className="py-2 text-center font-bold">
                      {t.pagamento === 'Nota Atrasada' ? (
                        <span className="text-red-600 text-[10px] uppercase animate-pulse">⚠️ Nota Atrasada</span>
                      ) : (
                        <span className="text-[var(--muted)]">—</span>
                      )}
                    </td>
                    
                    {/* Data Anterior */}
                    <td className="py-2 text-center text-slate-500 mono">{t.date_previous || '—'}</td>
                    
                    {/* Valor Anterior */}
                    <td className="py-2 text-right text-slate-500 mono">{t.value_previous ? brl(t.value_previous) : '—'}</td>
                    
                    {/* Justificativa GAP */}
                    <td className="py-2 text-center px-1">
                      <select 
                        value={t.gap_justification || ''}
                        onChange={(e) => handleUpdateTaskField(t.id, 'gap_justification', e.target.value)}
                        className="bg-white border border-gray-300 rounded px-1 py-0.5 text-[10px] w-full max-w-[150px] outline-none"
                      >
                        <option value="">Nenhuma</option>
                        <option value="Atraso do cliente na aprovação">Atraso cliente na aprovação</option>
                        <option value="Atraso do cliente na liberação da obra">Atraso cliente na liberação</option>
                        <option value="Replanejamento de escopo">Replanejamento de escopo</option>
                        <option value="Reajuste contratual pendente">Reajuste pendente</option>
                      </select>
                    </td>
                    
                    {/* Lançar Navis */}
                    <td className="py-2 text-center">
                      <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                        t.launch_navis === 'Lançar' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {t.launch_navis}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Reajuste Modal */}
      <Modal
        show={showReajusteModal}
        onClose={() => setShowReajusteModal(false)}
        title="Reajuste de Valores de Contrato"
        subtitle={`Projeto: ${selectedProject.name}`}
        actions={
          <>
            <button className="btn btn-rej" onClick={() => setShowReajusteModal(false)}>Cancelar</button>
            <button className="btn btn-apr" onClick={handleApplyReajuste}>Aplicar Índice</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">Índice</label>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setReajusteIndex('INCC-M')}
                className={`flex-1 py-1.5 rounded text-xs font-semibold border ${reajusteIndex === 'INCC-M' ? 'bg-sky-100 border-sky-500 text-sky-800' : 'bg-white border-gray-300'}`}
              >
                INCC-M
              </button>
              <button 
                type="button"
                onClick={() => setReajusteIndex('IPC')}
                className={`flex-1 py-1.5 rounded text-xs font-semibold border ${reajusteIndex === 'IPC' ? 'bg-sky-100 border-sky-500 text-sky-800' : 'bg-white border-gray-300'}`}
              >
                IPC
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">Porcentagem de Reajuste (%)</label>
            <input 
              type="number" 
              value={reajustePct}
              onChange={(e) => setReajustePct(Number(e.target.value))}
              step="0.01"
              className="w-full bg-[var(--surface2)] border border-[var(--border2)] rounded px-3 py-1.5 text-sm outline-none"
            />
          </div>
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            * O sistema irá identificar as linhas classificadas como "Reajuste" e aplicar o multiplicador atualizando os valores e mantendo a rastreabilidade na coluna 'Valor Anterior'.
          </p>
        </div>
      </Modal>
    </Layout>
  );
}
