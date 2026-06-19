'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchProjects, fetchTasks, fetchPreviousFlowRows, fetchRawTaskRows, fetchReajusteHistory, brl, updateTaskFieldInDb, projectActionInDb, approveFlowInDb, applyReajusteInDb, releaseFlowInDb, requestFlowReviewInDb, fetchProjectStageSummary, updateProjectMargin } from '../lib/data';
import { showToast } from '../components/Toast';
import type { Project, Task, TaskStatus, PreviousFlowRow, RawTaskRow, ReajusteHistory, ProjectStageSummary } from '../lib/types';
import { STATUS_LABELS } from '../lib/types';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { Search, AlertOctagon, Check, FileSpreadsheet, ArrowUpDown } from 'lucide-react';

type WorkbookTab = 'tasks' | 'mes-atual' | 'mes-anterior' | 'planejado';

const workbookTabs: { id: WorkbookTab; label: string }[] = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'mes-atual', label: 'Mês Atual' },
  { id: 'mes-anterior', label: 'Mês Anterior' },
  { id: 'planejado', label: 'Planejado x Contratado' },
];



type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  itemName: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

function PaginationControls({ currentPage, totalPages, pageSize, totalItems, itemName, onPageChange, onPageSizeChange }: PaginationControlsProps) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(totalItems, currentPage * pageSize);
  const pageSizes = [10, 25, 50, 100];

  return (
    <div className="table-controls">
      <div className="table-page-info">
        Mostrando {start}–{end} de {totalItems} {itemName}
      </div>
      <div className="table-page-actions">
        <button type="button" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
          Anterior
        </button>
        <button type="button" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
          Próxima
        </button>
        <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.currentTarget.value))}>
          {pageSizes.map((size) => (
            <option key={size} value={size}>
              {size} / página
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR');
}

function num(value: number | null | undefined): string {
  return value == null ? '—' : value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

const currentMonthColumns = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const tasksColumns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

function excelRowClass(task: Task): string {
  const classes = ['excel-data-row'];
  if (task.status_nf === 'Pago') {
    return classes.join(' ');
  }
  if (task.line_color === 'azul' || task.status_nf === 'Enviar Nota') classes.push('excel-row-blue');
  if (task.is_new_faturavel || task.name_changed || task.new_flag === 'NOVO' || task.change_indicator === 'verde') classes.push('excel-row-green');
  if (task.launch_navis === 'Não Lançar' || task.text_style === 'tachado') classes.push('excel-row-disabled');
  return classes.join(' ');
}

function excelCellClass(task: Task, column: 'date' | 'value' | 'gap' | 'launch' | 'status' | 'activity' | 'etapa'): string {
  const classes = ['excel-cell'];
  if (task.status_nf === 'Pago') {
    return classes.join(' ');
  }
  if (column === 'date' && task.date_changed) classes.push('excel-cell-changed');
  if (column === 'value' && task.value_changed) classes.push('excel-cell-changed');
  if (column === 'gap' && task.gap_justification === 'Justificar GAP no Wrike') classes.push('excel-cell-gap');
  if (column === 'launch' && task.launch_navis === 'Não Lançar') classes.push('excel-cell-muted');
  if (column === 'status' && task.status_nf === 'Enviar Nota') classes.push('excel-cell-send-note');
  if (column === 'activity' && task.additive_type) classes.push('excel-cell-additive');
  if (column === 'etapa' && (task.is_new_faturavel || task.name_changed || task.new_flag === 'NOVO' || task.change_indicator === 'verde')) classes.push('excel-cell-new');
  return classes.join(' ');
}

export default function Faturamento() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectIdParam = searchParams?.get('projectId');

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [previousFlowRows, setPreviousFlowRows] = useState<PreviousFlowRow[]>([]);
  const [rawTaskRows, setRawTaskRows] = useState<RawTaskRow[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectIdParam || '');
  const [activeSheet, setActiveSheet] = useState<WorkbookTab>('mes-atual');
  const [filter, setFilter] = useState<TaskStatus | 'all' | 'critical'>('all');
  const [search, setSearch] = useState('');
  const [showReajusteModal, setShowReajusteModal] = useState(false);
  const [reajusteIndex, setReajusteIndex] = useState<'INCC-M' | 'IPC'>('INCC-M');
  const [reajustePct, setReajustePct] = useState<number>(4.2);
  const [reajusteHistory, setReajusteHistory] = useState<ReajusteHistory[]>([]);
  const [stageSummary, setStageSummary] = useState<ProjectStageSummary | null>(null);
  const [currentTasksPage, setCurrentTasksPage] = useState(1);
  const [tasksPageSize, setTasksPageSize] = useState(25);
  const [currentRawPage, setCurrentRawPage] = useState(1);
  const [rawPageSize, setRawPageSize] = useState(25);
  const [currentPreviousPage, setCurrentPreviousPage] = useState(1);
  const [previousPageSize, setPreviousPageSize] = useState(25);
  const [taskDateSortDirection, setTaskDateSortDirection] = useState<'asc' | 'desc'>('asc');

  const load = useCallback(async () => {
    const [p, t] = await Promise.all([fetchProjects(), fetchTasks()]);
    setProjects(p);
    setTasks(t);
    if (p.length > 0 && !selectedProjectId && !projectIdParam) {
      setSelectedProjectId(p[0].id);
    }
  }, [selectedProjectId, projectIdParam]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (projectIdParam) {
      setSelectedProjectId(projectIdParam);
    }
  }, [projectIdParam]);

  useEffect(() => {
    if (!selectedProjectId) return;

    let cancelled = false;

    async function loadWorkbookSheets() {
      try {
        const [previousRows, rawRows, historyRows, summaryRow] = await Promise.all([
          fetchPreviousFlowRows(selectedProjectId),
          fetchRawTaskRows(selectedProjectId),
          fetchReajusteHistory(selectedProjectId),
          fetchProjectStageSummary(selectedProjectId),
        ]);

        if (!cancelled) {
          setPreviousFlowRows(previousRows);
          setRawTaskRows(rawRows);
          setReajusteHistory(historyRows);
          setStageSummary(summaryRow);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setPreviousFlowRows([]);
          setRawTaskRows([]);
          setReajusteHistory([]);
          setStageSummary(null);
        }
      }
    }

    loadWorkbookSheets();

    return () => {
      cancelled = true;
    };
  }, [selectedProjectId]);

  useEffect(() => {
    setCurrentTasksPage(1);
  }, [filter, search, selectedProjectId]);

  useEffect(() => {
    setCurrentRawPage(1);
    setCurrentPreviousPage(1);
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

  const handleReleaseFlow = async (projectId: string) => {
    try {
      await releaseFlowInDb(projectId);
      await load();
      showToast('✅', 'Fluxo Liberado', 'Fluxo marcado como liberado para operações subsequentes.', 'tg');
    } catch (e) {
      console.error(e);
      showToast('❌', 'Erro ao liberar fluxo', 'Não foi possível liberar o fluxo.', 'tr');
    }
  };

  const handleRequestFlowReview = async (projectId: string) => {
    try {
      await requestFlowReviewInDb(projectId);
      await load();
      showToast('✉️', 'Revisão Solicitada', 'Revisão do fluxo foi solicitada ao responsável.', 'tg');
    } catch (e) {
      console.error(e);
      showToast('❌', 'Erro ao solicitar revisão', 'Não foi possível solicitar revisão do fluxo.', 'tr');
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

  const [isEditingMargin, setIsEditingMargin] = useState(false);
  const [marginInputValue, setMarginInputValue] = useState('');

  useEffect(() => {
    if (selectedProject) {
      setMarginInputValue(String(selectedProject.margin_pct ?? 0));
    }
  }, [selectedProject]);

  const handleSaveMargin = async () => {
    const numVal = parseFloat(marginInputValue.replace(',', '.'));
    if (isNaN(numVal)) {
      showToast('⚠️', 'Valor Inválido', 'Por favor, insira um valor numérico válido para a margem.', 'tr');
      return;
    }
    try {
      await updateProjectMargin(selectedProject.id, numVal);
      await load();
      setIsEditingMargin(false);
      showToast('✅', 'Margem Atualizada', `Margem do projeto atualizada para ${numVal}%.`, 'tg');
    } catch (e) {
      console.error(e);
      showToast('❌', 'Erro ao salvar', 'Não foi possível atualizar a margem do projeto.', 'tr');
    }
  };

  if (!selectedProject) {
    return <Layout breadcrumb={[{ label: 'Fluxo Financeiro' }]}><div className="p-8">Carregando...</div></Layout>;
  }

  // Filter tasks belonging to current project
  const projectTasks = tasks.filter(t => t.project_id === selectedProject.id);

  const filteredTasks = projectTasks.filter(t => {
    if (filter === 'critical') {
      if (!selectedProject.is_critical) return false;
    } else if (filter !== 'all' && t.status !== filter) {
      return false;
    }
    if (search) {
      const term = search.toLowerCase();
      return t.name.toLowerCase().includes(term) || t.etapa.toLowerCase().includes(term);
    }
    return true;
  });

  // Sort tasks chronologically by due_date (ascending), placing tasks without dates at the end
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aDate = a.due_date ? new Date(a.due_date).getTime() : null;
    const bDate = b.due_date ? new Date(b.due_date).getTime() : null;

    if (aDate === null && bDate === null) return 0;
    if (aDate === null) return 1;
    if (bDate === null) return -1;

    return taskDateSortDirection === 'asc' ? aDate - bDate : bDate - aDate;
  });

  const tasksPageCount = Math.max(1, Math.ceil(sortedTasks.length / tasksPageSize));
  const displayedTasks = sortedTasks.slice((currentTasksPage - 1) * tasksPageSize, currentTasksPage * tasksPageSize);

  const rawPageCount = Math.max(1, Math.ceil(rawTaskRows.length / rawPageSize));
  const displayedRawRows = rawTaskRows.slice((currentRawPage - 1) * rawPageSize, currentRawPage * rawPageSize);

  const previousPageCount = Math.max(1, Math.ceil(previousFlowRows.length / previousPageSize));
  const displayedPreviousRows = previousFlowRows.slice((currentPreviousPage - 1) * previousPageSize, currentPreviousPage * previousPageSize);

  const SUMMARY_COLUMNS = [
    { key: 'projeto', label: 'Projeto' },
    { key: 'eficiencia', label: 'Eficiência Energética' },
    { key: 'carbono', label: 'Carbono' },
    { key: 'materiais', label: 'Materiais' },
    { key: 'obras', label: 'Obras' },
    { key: 'operacao', label: 'Operação e Manutenção' },
    { key: 'eventos', label: 'Eventos' },
    { key: 'sistemas_prediais', label: 'Sistemas Prediais' },
    { key: 'conforto', label: 'Conforto' },
    { key: 'acustica', label: 'Acústica' },
    { key: 'rec', label: 'REC' },
    { key: 'reajuste', label: 'Reajuste' },
    { key: 'retencao', label: 'Retenção' },
    { key: 'repasse', label: 'Repasse' },
    { key: 'taxa', label: 'Taxa' },
  ] as const;

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

  const formatStageValue = (v: number | null | undefined) => {
    if (v == null || v === 0) return 'R$ 0';
    return brl(v);
  };

  const hasValue = (val: string | null | undefined) => {
    if (!val) return false;
    const trimmed = val.trim();
    return trimmed !== '' && trimmed !== '—' && trimmed !== '-' && trimmed !== 'undefined';
  };

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
        <div className="mx-4 mt-4 bg-purple-900/10 border border-purple-500/30 text-purple-900 p-3 rounded-lg flex items-center justify-between animate-pulse">
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
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-3 border-b border-[var(--border)] gap-4">
            <div className="flex items-start gap-3">
              <div className="w-3.5 h-3.5 rounded-full mt-1.5" style={{ backgroundColor: selectedProject.color }} />
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">{selectedProject.name}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1 mt-2 text-xs text-[var(--muted)]">
                  {hasValue(selectedProject.client) && (
                    <div>Cliente: <span className="font-semibold text-[var(--text2)]">{selectedProject.client}</span></div>
                  )}
                  {hasValue(selectedProject.coordenador || selectedProject.responsible) && (
                    <div>Coordenador: <span className="font-semibold text-[var(--text2)]">{selectedProject.coordenador || selectedProject.responsible}</span></div>
                  )}
                  {hasValue(selectedProject.owner) && (
                    <div>Owner: <span className="font-semibold text-[var(--text2)]">{selectedProject.owner}</span></div>
                  )}
                  {hasValue(selectedProject.rotulo_1 || selectedProject.label_code) && (
                    <div>Rótulo 1: <span className="font-semibold text-[var(--text2)]">{selectedProject.rotulo_1 || selectedProject.label_code}</span></div>
                  )}
                  {hasValue(selectedProject.rotulo_2) && (
                    <div>Rótulo 2: <span className="font-semibold text-[var(--text2)]">{selectedProject.rotulo_2}</span></div>
                  )}
                  {hasValue(selectedProject.servico_1) && (
                    <div>Serviço 1: <span className="font-semibold text-[var(--text2)]">{selectedProject.servico_1}</span></div>
                  )}
                  {hasValue(selectedProject.servico_2) && (
                    <div>Serviço 2: <span className="font-semibold text-[var(--text2)]">{selectedProject.servico_2}</span></div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 self-end md:self-center">
              <select 
                value={selectedProjectId} 
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedProjectId(newId);
                  router.push(`/faturamento?projectId=${newId}`);
                }}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="bg-[var(--surface2)] p-2 rounded">
              <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Valor Original</div>
              <div className="text-sm font-bold text-[var(--text)]">{brl(selectedProject.contract_original_value)}</div>
            </div>
            <div className="bg-[var(--surface2)] p-2 rounded">
              <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Total Aditivado</div>
              <div className="text-sm font-bold text-[var(--text)]">{brl(selectedProject.contract_aditivo_value)}</div>
            </div>
            <div className="bg-[var(--surface2)] p-2 rounded">
              <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Adicional Reajuste</div>
              <div className="text-sm font-bold text-[var(--text)]">{brl(selectedProject.reajuste_adicional_value)}</div>
            </div>
            <div className="bg-[var(--surface2)] p-2 rounded flex flex-col justify-between min-h-[58px]">
              <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Margem</div>
              <div className="flex items-center gap-1">
                {isEditingMargin ? (
                  <div className="flex items-center gap-1 w-full justify-between">
                    <input
                      type="text"
                      value={marginInputValue}
                      onChange={(e) => setMarginInputValue(e.target.value)}
                      className="w-12 text-center bg-white border border-[var(--border2)] rounded text-xs py-0.5 outline-none font-semibold text-amber-900"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveMargin();
                        if (e.key === 'Escape') setIsEditingMargin(false);
                      }}
                    />
                    <span className="text-xs font-bold text-amber-700">%</span>
                    <button
                      onClick={handleSaveMargin}
                      className="text-emerald-600 hover:text-emerald-700 p-0.5"
                      title="Salvar"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 w-full justify-between">
                    <span className="text-sm font-bold text-amber-700">
                      {selectedProject.margin_pct != null 
                        ? `${(selectedProject.margin_pct).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
                        : '—'}
                    </span>
                    <button
                      onClick={() => {
                        setMarginInputValue(String(selectedProject.margin_pct ?? 0));
                        setIsEditingMargin(true);
                      }}
                      className="text-[var(--muted)] hover:text-amber-700 p-0.5 transition"
                      title="Editar Margem"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-[#f7f3ff] p-2 rounded border border-violet-200">
              <div className="text-[10px] uppercase font-bold text-violet-700">Valor Contratado</div>
              <div className="text-sm font-bold text-violet-900">{brl(selectedProject.contracted_value)}</div>
            </div>
            <div className="bg-[#e8f5e9] p-2 rounded border border-emerald-200">
              <div className="text-[10px] uppercase font-bold text-emerald-700">Valor Reajustado</div>
              <div className="text-sm font-bold text-emerald-900">{brl(selectedProject.contracted_value)}</div>
            </div>
            <div className="bg-[#eefcfc] p-2 rounded border border-teal-200">
              <div className="text-[10px] uppercase font-bold text-teal-700">Lançado Navis</div>
              <div className="text-sm font-bold text-teal-900">{brl(selectedProject.navis_launched_value)}</div>
            </div>
            <div className="bg-[#fdf4ff] p-2 rounded border border-purple-200">
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
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleReleaseFlow(selectedProject.id)}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-1 rounded transition"
              >
                Fluxo Liberado
              </button>
              <button
                onClick={() => handleRequestFlowReview(selectedProject.id)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-1 rounded transition"
              >
                Revisar Fluxo
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button onClick={() => handleProjectAction(selectedProject.id, 'medido')} className="bg-[var(--surface3)] hover:bg-[var(--border2)] text-[10px] font-bold py-1 rounded transition text-center">Medições</button>
              <button onClick={() => handleProjectAction(selectedProject.id, 'faturado')} className="bg-[var(--surface3)] hover:bg-[var(--border2)] text-[10px] font-bold py-1 rounded transition text-center">Faturar</button>
              <button onClick={() => handleProjectAction(selectedProject.id, 'pago')} className="bg-[var(--surface3)] hover:bg-[var(--border2)] text-[10px] font-bold py-1 rounded transition text-center">Confirmar Pg</button>
            </div>
            {selectedProject.flow_released && (
              <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
                Fluxo liberado em {selectedProject.flow_released_at ? new Date(selectedProject.flow_released_at).toLocaleDateString('pt-BR') : 'data registrada'}.
              </div>
            )}
            {selectedProject.flow_review_requested && (
              <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                Revisão solicitada em {selectedProject.flow_review_requested_at ? new Date(selectedProject.flow_review_requested_at).toLocaleDateString('pt-BR') : 'data registrada'}.
              </div>
            )}
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
                {SUMMARY_COLUMNS.map(col => (
                  <th key={col.key} className="py-2 font-bold text-[var(--muted)]">{col.label.toUpperCase()}</th>
                ))}
                <th className="py-2 font-bold text-[var(--text)]">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 text-left pl-4 font-semibold text-[var(--text2)]">Valor Wrike</td>
                {SUMMARY_COLUMNS.map(col => {
                  const val = stageSummary ? stageSummary[col.key] : 0;
                  return (
                    <td key={col.key} className="py-2 text-[var(--text2)]">
                      {formatStageValue(val)}
                    </td>
                  );
                })}
                <td className="py-2 font-bold text-teal-700">
                  {formatStageValue(stageSummary?.total ?? 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mx-4 mb-6 bg-white border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[var(--surface2)] px-4 py-2 text-xs font-bold text-[var(--muted)] border-b border-[var(--border)]">
          Histórico de Reajustes
        </div>
        <div className="p-4">
          {reajusteHistory.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">Nenhum reajuste registrado para este projeto.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-[var(--surface3)] border-b border-[var(--border2)]">
                    {['Data', 'Índice', '% Reajuste', 'Valor Original', 'Reajuste', 'Reajustado'].map((header) => (
                      <th key={header} className="py-2 text-left px-2">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reajusteHistory.map((item) => (
                    <tr key={item.id} className="border-b border-[var(--border)]">
                      <td className="py-2 px-2">{new Date(item.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="py-2 px-2">{item.index_name}</td>
                      <td className="py-2 px-2">{Number(item.percentage).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%</td>
                      <td className="py-2 px-2">{brl(item.original_value)}</td>
                      <td className="py-2 px-2">{brl(item.reajuste_value)}</td>
                      <td className="py-2 px-2">{brl(item.readjusted_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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



      {activeSheet === 'tasks' && (
        <div className="mx-4 bg-white border border-[var(--border)] rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-[1280px] text-xs">
              <thead>
                <tr className="excel-column-row">
                  {tasksColumns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
                <tr className="bg-[#d9ead3] border-b border-[var(--border2)]">
                  {['Nome', 'Data inicial', 'Vencimento', 'GAP', 'Status', 'Responsável', 'Valor Contratado', '$ Valor Planejado', 'Diferença $', 'Consultor', 'Analista', 'Estagiário'].map((header) => (
                    <th key={header} className="py-2.5">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedRawRows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border)]">
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
          <PaginationControls
            currentPage={currentRawPage}
            totalPages={rawPageCount}
            pageSize={rawPageSize}
            totalItems={rawTaskRows.length}
            itemName="linhas de Tasks"
            onPageChange={setCurrentRawPage}
            onPageSizeChange={(size) => { setRawPageSize(size); setCurrentRawPage(1); }}
          />
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
                {displayedPreviousRows.map((row) => (
                  <tr key={row.id} className={`border-b border-[var(--border)] ${row.launch_navis === 'Não Lançar' ? 'opacity-60' : ''}`}>
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
          <PaginationControls
            currentPage={currentPreviousPage}
            totalPages={previousPageCount}
            pageSize={previousPageSize}
            totalItems={previousFlowRows.length}
            itemName="linhas de histórico"
            onPageChange={setCurrentPreviousPage}
            onPageSizeChange={(size) => { setPreviousPageSize(size); setCurrentPreviousPage(1); }}
          />
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
                  <tr key={row.month} className="border-b border-[var(--border)]">
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-secondary inline-flex items-center gap-1 text-[11px] px-2 py-1"
              onClick={() => setTaskDateSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            >
              <ArrowUpDown size={12} />
              Ordenar data: {taskDateSortDirection === 'asc' ? 'Cresc.' : 'Desc.'}
            </button>
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
      </div>

      {/* Main Excel-like Spreadsheet Table */}
      <div className="mx-4 bg-white border border-[var(--border)] rounded-xl shadow-sm overflow-hidden mb-8 excel-sheet">
        <div className="overflow-x-auto">
          <table className="min-w-[1320px] text-xs excel-grid">
            <thead>
              <tr className="excel-column-row">
                <th className="excel-corner" />
                {currentMonthColumns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
              <tr className="bg-[var(--surface3)] border-b border-[var(--border2)]">
                <th className="excel-row-header">31</th>
                <th className="py-2.5 w-28">Etapa</th>
                <th className="py-2.5 min-w-[380px]">Atividade</th>
                <th className="py-2.5 text-center w-24">N.º Navis</th>
                <th className="py-2.5 text-right w-32">Valor</th>
                <th className="py-2.5 text-center w-36">Data</th>
                <th className="py-2.5 text-center w-28">Status NF</th>
                <th className="py-2.5 text-center w-32">Pagamento</th>
                <th className="py-2.5 text-center w-32">Data Anterior</th>
                <th className="py-2.5 text-right w-32">Valor Anterior</th>
                <th className="py-2.5 w-44 text-center">Justificativa GAP</th>
                <th className="py-2.5 text-center w-28">Lançar Navis</th>
              </tr>
            </thead>
            <tbody>
              {displayedTasks.map((t, index) => {
                return (
                  <tr key={t.id} className={excelRowClass(t)}>
                    <td className="excel-row-number">{index + 32}</td>
                    {/* Etapa */}
                    <td className={excelCellClass(t, 'etapa')}>
                      <span className="font-bold text-[var(--text2)]">{t.etapa}</span>
                      {t.new_flag === 'NOVO' && <span className="excel-formula-chip">NOVO</span>}
                    </td>
                    
                    {/* Atividade & Team code label */}
                    <td className={excelCellClass(t, 'activity')}>
                      <div className="excel-task-title">{t.name}</div>
                      {(t.additive_type || t.line_color || t.change_indicator) && (
                        <div className="excel-formula-notes">
                          {t.additive_type && <span>{t.additive_type}</span>}
                          {t.line_color === 'azul' && <span>Mês atual</span>}
                          {t.change_indicator === 'verde' && <span>Item novo</span>}
                        </div>
                      )}
                    </td>
                    
                    {/* N.º Navis */}
                    <td className="excel-cell text-center mono font-semibold">{t.navis_num}</td>
                    
                    {/* Valor */}
                    <td className={`${excelCellClass(t, 'value')} text-right mono font-bold text-emerald-700`}>{brl(t.value)}</td>
                    
                    {/* Data Conclusão */}
                    <td className={`${excelCellClass(t, 'date')} text-center`}>
                      <input 
                        type="date"
                        value={t.due_date ? t.due_date.split('T')[0] : ''}
                        onChange={(e) => handleUpdateTaskField(t.id, 'due_date', e.target.value)}
                        className="excel-input"
                      />
                    </td>
                    
                    {/* Status NF */}
                    <td className={`${excelCellClass(t, 'status')} text-center`}>
                      <select 
                        value={t.status_nf}
                        onChange={(e) => handleUpdateTaskField(t.id, 'status_nf', e.target.value)}
                        className="excel-select"
                      >
                        <option value="—">—</option>
                        <option value="Pago">Pago</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Nota Enviada">Nota Enviada</option>
                        <option value="Enviar Nota">Enviar Nota</option>
                      </select>
                    </td>
                    
                    {/* Pagamento */}
                    <td className="excel-cell text-center font-bold">
                      {t.pagamento === 'Nota Atrasada' ? (
                        <span className="excel-alert-text">Nota Atrasada</span>
                      ) : (
                        <span className="text-[var(--muted)]">{t.pagamento || '—'}</span>
                      )}
                    </td>
                    
                    {/* Data Anterior */}
                    <td className="excel-cell text-center text-slate-500 mono">{formatDate(t.date_previous)}</td>
                    
                    {/* Valor Anterior */}
                    <td className="excel-cell text-right text-slate-500 mono">{t.value_previous ? brl(t.value_previous) : '—'}</td>
                    
                    {/* Justificativa GAP */}
                    <td className={`${excelCellClass(t, 'gap')} text-center px-1`}>
                      <select 
                        value={t.gap_justification || ''}
                        onChange={(e) => handleUpdateTaskField(t.id, 'gap_justification', e.target.value)}
                        className="excel-select w-full"
                      >
                        <option value="">Nenhuma</option>
                        <option value="Justificar GAP no Wrike">Justificar GAP no Wrike</option>
                        <option value="Cliente Solicitou Alteração / Não Aprovou">Cliente Solicitou Alteração / Não Aprovou</option>
                        <option value="CTE não entregou por indisponibilidade de equipe">CTE não entregou por indisponibilidade de equipe</option>
                        <option value="Erro de planejamento">Erro de planejamento</option>
                        <option value="Cliente não liberou a execução">Cliente não liberou a execução</option>
                        <option value="Alteração de Cronograma">Alteração de Cronograma</option>
                        <option value="Atraso de projeto/obra">Atraso de projeto/obra</option>
                        <option value="Faltou dados/documentos por parte do cliente">Faltou dados/documentos por parte do cliente</option>
                        <option value="Redução de escopo">Redução de escopo</option>
                        <option value="Paralisação">Paralisação</option>
                        <option value="Cancelamento do projeto">Cancelamento do projeto</option>
                        <option value="Eventos Climáticos Extremos/Pandemia">Eventos Climáticos Extremos/Pandemia</option>
                        <option value="Acidente de obras">Acidente de obras</option>
                        <option value="Falta de Pagamento">Falta de Pagamento</option>
                      </select>
                    </td>
                    
                    {/* Lançar Navis */}
                    <td className={`${excelCellClass(t, 'launch')} text-center`}>
                      <span className="excel-status-chip">{t.launch_navis}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <PaginationControls
          currentPage={currentTasksPage}
          totalPages={tasksPageCount}
          pageSize={tasksPageSize}
          totalItems={filteredTasks.length}
          itemName="atividades"
          onPageChange={setCurrentTasksPage}
          onPageSizeChange={(size) => { setTasksPageSize(size); setCurrentTasksPage(1); }}
        />
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
