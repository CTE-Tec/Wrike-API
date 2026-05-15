import { useEffect, useState } from 'react';
import { fetchTasks, fetchProjects, brl } from '../lib/data';
import type { Task, Project } from '../lib/types';
import { STATUS_LABELS } from '../lib/types';
import Layout from '../components/Layout';
import StatusPill from '../components/StatusPill';
import { CheckSquare, Clock, AlertCircle } from 'lucide-react';

export default function MyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<'all' | 'fat' | 'vis' | 'agu' | 'apr'>('all');

  useEffect(() => {
    Promise.all([fetchTasks(), fetchProjects()]).then(([t, p]) => {
      setTasks(t);
      setProjects(p);
    });
  }, []);

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));
  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  const counts = {
    all: tasks.length,
    fat: tasks.filter((t) => t.status === 'fat').length,
    vis: tasks.filter((t) => t.status === 'vis').length,
    agu: tasks.filter((t) => t.status === 'agu').length,
    apr: tasks.filter((t) => t.status === 'apr').length,
  };

  const toolbar = (
    <div className="vtoolbar">
      <div className="vtabs">
        {(['all', 'fat', 'vis', 'agu', 'apr'] as const).map((f) => (
          <div
            key={f}
            className={`vtab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' && <CheckSquare size={11} />}
            {f === 'fat' && <AlertCircle size={11} />}
            {f === 'vis' && <Clock size={11} />}
            {f === 'agu' && <AlertCircle size={11} />}
            {f === 'apr' && <CheckSquare size={11} />}
            {f === 'all' ? 'Todas' : STATUS_LABELS[f]} ({counts[f]})
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Layout
      breadcrumb={[
        { label: 'Inteligência Artificial | Projetos' },
        { label: 'Minhas tarefas', active: true },
      ]}
      toolbar={toolbar}
    >
      <div className="p-3.5">
        <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[var(--surface3)] border-b border-[var(--border2)]">
                <th className="p-2 px-3 text-left text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Tarefa</th>
                <th className="p-2 px-3 text-left text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Projeto</th>
                <th className="p-2 px-3 text-left text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Status</th>
                <th className="p-2 px-3 text-left text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Valor</th>
                <th className="p-2 px-3 text-left text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Vencimento</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const proj = projectMap[t.project_id];
                return (
                  <tr key={t.id} className="border-b border-[var(--border)] hover:bg-[var(--surface2)] transition-colors">
                    <td className="p-2.5 px-3">
                      <div className="font-medium text-[var(--text)]">{t.name}</div>
                      <div className="text-[11px] text-[var(--muted)] mt-0.5">{t.description}</div>
                    </td>
                    <td className="p-2.5 px-3 text-[12px] text-[var(--text2)]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: proj?.color || '#999' }} />
                        {proj?.name || '—'}
                      </div>
                    </td>
                    <td className="p-2.5 px-3"><StatusPill status={t.status} /></td>
                    <td className="p-2.5 px-3 mono text-[12px] c-green">{brl(t.value)}</td>
                    <td className="p-2.5 px-3 mono text-[12px] c-muted">
                      {t.due_date ? new Date(t.due_date).toLocaleDateString('pt-BR') : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-14 text-[var(--muted)]">Nenhuma tarefa encontrada.</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
