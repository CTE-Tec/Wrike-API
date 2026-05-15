'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchProjects, fetchTasks, updateTaskStatus, brl } from '../lib/data';
import { showToast } from '../components/Toast';
import type { Project, Task, TaskStatus } from '../lib/types';
import { STATUS_LABELS } from '../lib/types';
import Layout from '../components/Layout';
import StatusPill from '../components/StatusPill';
import Modal from '../components/Modal';
import { LayoutGrid, Kanban, Calendar, Search, SlidersHorizontal } from 'lucide-react';

export default function Faturamento() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [modalProject, setModalProject] = useState<Project | null>(null);

  const load = useCallback(async () => {
    const [p, t] = await Promise.all([fetchProjects(), fetchTasks()]);
    setProjects(p);
    setTasks(t);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const handleSendApproval = async (taskId: string) => {
    await updateTaskStatus(taskId, 'agu');
    const t = tasks.find((x) => x.id === taskId);
    showToast('📤', 'Aprovação enviada', `E-mail enviado a ${t?.responsible}`, 'to');
    load();
  };

  const handleApprove = async () => {
    if (!modalTask) return;
    await updateTaskStatus(modalTask.id, 'apr');
    showToast('✅', 'Aprovado!', `${modalTask.name} aprovado para faturamento.`, 'tg');
    setModalTask(null);
    setModalProject(null);
    load();
  };

  const handleReject = async (taskId: string) => {
    await updateTaskStatus(taskId, 'vis');
    const t = tasks.find((x) => x.id === taskId);
    showToast('📩', 'Reprovado', `${t?.name} devolvido para revisão`, 'tr');
    load();
  };

  const openApprovalModal = (task: Task, project: Project) => {
    setModalTask(task);
    setModalProject(project);
  };

  const term = search.toLowerCase();

  const filteredProjects = projects.map((p) => {
    const pTasks = tasks.filter((t) => t.project_id === p.id);
    const filtered = pTasks.filter((t) => {
      if (filter !== 'all' && t.status !== filter) return false;
      if (term && !t.name.toLowerCase().includes(term) && !p.name.toLowerCase().includes(term)) return false;
      return true;
    });
    return { ...p, tasks: filtered };
  }).filter((p) => p.tasks.length > 0 || (term && p.name.toLowerCase().includes(term)));

  const totalFaturar = tasks.filter((t) => t.status === 'fat').reduce((s, t) => s + t.value, 0);
  const totalAprovado = tasks.filter((t) => t.status === 'apr').reduce((s, t) => s + t.value, 0);
  const alertCount = projects.filter((p) => p.tasks_total > p.contracted_value).length;

  const toolbar = (
    <div className="vtoolbar">
      <div className="vtabs">
        <div className="vtab active">
          <LayoutGrid size={11} />
          Tabela
        </div>
        <div className="vtab" onClick={() => showToast('ℹ️', 'Kanban', 'Em desenvolvimento', '')}>
          <Kanban size={11} />
          Kanban
        </div>
        <div className="vtab" onClick={() => showToast('ℹ️', 'Cronograma', 'Em desenvolvimento', '')}>
          <Calendar size={11} />
          Cronograma
        </div>
      </div>
      <div className="vsep" />
      <div className="flex gap-1 flex-wrap">
        {(['all', 'fat', 'vis', 'agu', 'apr'] as const).map((f) => (
          <button
            key={f}
            className={`fchip${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Todos' : `● ${STATUS_LABELS[f]}`}
          </button>
        ))}
      </div>
      <div className="vright">
        <div className="search-box">
          <Search size={12} className="absolute left-[7px] text-[var(--muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-icon">
          <SlidersHorizontal size={13} />
        </button>
      </div>
    </div>
  );

  return (
    <Layout
      breadcrumb={[
        { label: 'Inteligência Artificial | Projetos' },
        { label: '3. Projetos Ativos | Desenvolvimento' },
        { label: 'Faturamento & Aprovação', active: true },
      ]}
      toolbar={toolbar}
    >
      <div className="kpi-strip">
        <div className="kpi-box kb-green">
          <div className="kpi-lbl">Total a Faturar</div>
          <div className="kpi-val">{brl(totalFaturar)}</div>
          <div className="kpi-sub">{tasks.filter((t) => t.status === 'fat').length} tarefas prontas</div>
        </div>
        <div className="kpi-box kb-teal">
          <div className="kpi-lbl">Em Visualização</div>
          <div className="kpi-val">{tasks.filter((t) => t.status === 'vis').length}</div>
          <div className="kpi-sub">tarefas em andamento</div>
        </div>
        <div className="kpi-box kb-orange">
          <div className="kpi-lbl">Aguard. Aprovação</div>
          <div className="kpi-val">{tasks.filter((t) => t.status === 'agu').length}</div>
          <div className="kpi-sub">aguardando resposta</div>
        </div>
        <div className="kpi-box kb-purple">
          <div className="kpi-lbl">Aprovados</div>
          <div className="kpi-val">{brl(totalAprovado)}</div>
          <div className="kpi-sub">{tasks.filter((t) => t.status === 'apr').length} tarefas aprovadas</div>
        </div>
        <div className="kpi-box kb-red">
          <div className="kpi-lbl">Alertas de Valor</div>
          <div className="kpi-val">{alertCount}</div>
          <div className="kpi-sub">projetos com divergência</div>
        </div>
      </div>

      {alertCount > 0 && (
        <div className="alert-bar">
          <span className="ab-icon">⚠️</span>
          <div>
            <div className="ab-title">Divergência detectada em {alertCount} projetos</div>
            <div className="ab-body">O somatório das tarefas excede o valor contratado. O responsável foi notificado automaticamente via e-mail.</div>
          </div>
        </div>
      )}

      <div className="projs-area">
        <div className="sec-hdr">Projetos Ativos</div>
        {filteredProjects.map((p) => {
          const ok = p.tasks_total <= p.contracted_value;
          const pct = Math.min(100, Math.round((p.tasks_total / p.contracted_value) * 100));
          const bar = ok ? 'var(--sustenta)' : 'var(--autodoc)';
          const open = !collapsed.has(p.id);
          const cnt = { fat: 0, vis: 0, agu: 0, apr: 0 } as Record<string, number>;
          p.tasks.forEach((t) => { cnt[t.status] = (cnt[t.status] || 0) + 1; });

          return (
            <div className="pcard" key={p.id}>
              <div className="phead" onClick={() => toggle(p.id)}>
                <div className="p-accent" style={{ background: p.color }} />
                <div className="p-info">
                  <div className="p-name">{p.name}</div>
                  <div className="p-meta">
                    <span>👤 {p.responsible}</span>
                    <span>📋 {p.tasks.length} itens</span>
                    <span>💰 {brl(p.contracted_value)}</span>
                  </div>
                </div>
                <div className="p-stats">
                  {cnt.fat ? <div className="sbadge" style={{ background: 'rgba(104,189,76,.12)', color: 'var(--sustenta)', borderColor: 'rgba(104,189,76,.22)' }}>{cnt.fat} Faturar</div> : null}
                  {cnt.agu ? <div className="sbadge" style={{ background: 'rgba(241,90,41,.12)', color: 'var(--qualtech)', borderColor: 'rgba(241,90,41,.22)' }}>{cnt.agu} Aguardando</div> : null}
                  {cnt.apr ? <div className="sbadge" style={{ background: 'rgba(163,76,157,.12)', color: 'var(--gerencia)', borderColor: 'rgba(163,76,157,.22)' }}>{cnt.apr} Aprovado</div> : null}
                </div>
                <button className={`toggle-btn ${open ? 'open' : ''}`}>▾</button>
              </div>
              <div className="pcol-bar">
                <span className={`vtag ${ok ? 'ok' : 'warn'}`}>
                  {ok ? '✓ Valor validado' : '⚠ Valor excedido'}
                </span>
                <div className="vbar-track">
                  <div className="vbar-fill" style={{ width: `${pct}%`, background: bar }} />
                </div>
                <span className="vnums">{brl(p.tasks_total)} / {brl(p.contracted_value)}</span>
              </div>
              {open && (
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Responsável</th>
                        <th>Status</th>
                        <th>Valor Contratado</th>
                        <th>Vencimento</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.tasks.map((t) => (
                        <tr key={t.id}>
                          <td className="t-name">
                            <div className="t-n">{t.name}</div>
                            <div className="t-d">{t.description}</div>
                          </td>
                          <td className="c-dim text-xs">{t.responsible}</td>
                          <td><StatusPill status={t.status} /></td>
                          <td className="mono c-green">{brl(t.value)}</td>
                          <td className="mono c-muted">{t.due_date ? new Date(t.due_date).toLocaleDateString('pt-BR') : '—'}</td>
                          <td className="acts">
                            {t.status === 'fat' && (
                              <button className="abtn abtn-send" onClick={() => handleSendApproval(t.id)}>Enviar Aprovação</button>
                            )}
                            {t.status === 'agu' && (
                              <>
                                <button className="abtn abtn-ok" onClick={() => openApprovalModal(t, p)}>Aprovar</button>
                                <button className="abtn abtn-rej" style={{ marginLeft: 4 }} onClick={() => handleReject(t.id)}>Reprovar</button>
                              </>
                            )}
                            {t.status !== 'fat' && t.status !== 'agu' && <span className="c-muted text-[11px]">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
        {filteredProjects.length === 0 && (
          <div className="text-center py-14 text-[var(--muted)]">Nenhum resultado encontrado.</div>
        )}
      </div>

      <Modal
        show={!!modalTask}
        onClose={() => { setModalTask(null); setModalProject(null); }}
        title={modalTask ? `Aprovação — ${modalTask.name}` : ''}
        subtitle={modalProject ? `Projeto: ${modalProject.name}` : ''}
        actions={
          <>
            <button className="btn btn-rej" onClick={() => { if (modalTask) { handleReject(modalTask.id); setModalTask(null); setModalProject(null); } }}>✕ &nbsp;Reprovar</button>
            <button className="btn btn-apr" onClick={handleApprove}>✓ &nbsp;Aprovar Faturamento</button>
          </>
        }
      >
        {modalTask && (
          <>
            <div className="mf">
              <label>Tarefa</label>
              <div className="mv">{modalTask.name}<br /><span style={{ fontSize: 11, color: 'var(--muted)' }}>{modalTask.description}</span></div>
            </div>
            <div className="mf">
              <label>Valor Contratado</label>
              <div className="mv big">{brl(modalTask.value)}</div>
            </div>
            <div className="mf">
              <label>Responsável</label>
              <div className="mv">👤 {modalTask.responsible} &nbsp;<span style={{ fontSize: 11, color: 'var(--muted)' }}>{modalTask.email}</span></div>
            </div>
            <div className="mf">
              <label>Vencimento</label>
              <div className="mv mono">{modalTask.due_date ? new Date(modalTask.due_date).toLocaleDateString('pt-BR') : '—'}</div>
            </div>
          </>
        )}
      </Modal>
    </Layout>
  );
}
