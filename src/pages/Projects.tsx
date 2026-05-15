import { useEffect, useState } from 'react';
import { fetchProjects, fetchTasks, brl } from '../lib/data';
import type { Project, Task } from '../lib/types';
import { STATUS_LABELS } from '../lib/types';
import Layout from '../components/Layout';
import { FolderOpen, Folder } from 'lucide-react';
import { useParams } from 'react-router-dom';

const FOLDER_META: Record<string, { title: string; icon: React.ReactNode; desc: string }> = {
  demandas: { title: '1. Demandas', icon: <FolderOpen size={16} />, desc: 'Demandas recebidas e em triagem' },
  aprovacao: { title: '2. Projetos em Aprovação', icon: <FolderOpen size={16} />, desc: 'Projetos aguardando aprovação para início' },
  implantados: { title: '4. Projetos Implantados', icon: <Folder size={16} />, desc: 'Projetos já implantados em produção' },
};

export default function Projects() {
  const { folder } = useParams<{ folder: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    Promise.all([fetchProjects(), fetchTasks()]).then(([p, t]) => {
      setProjects(p);
      setTasks(t);
    });
  }, []);

  const meta = FOLDER_META[folder || 'demandas'] || FOLDER_META.demandas;
  const projectTasks = (pid: string) => tasks.filter((t) => t.project_id === pid);

  return (
    <Layout
      breadcrumb={[
        { label: 'Inteligência Artificial | Projetos' },
        { label: meta.title, active: true },
      ]}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--surface3)] flex items-center justify-center text-[var(--cte2)]">
            {meta.icon}
          </div>
          <div>
            <h1 className="text-[16px] font-bold text-[var(--text)]">{meta.title}</h1>
            <p className="text-[12px] text-[var(--muted)]">{meta.desc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {projects.map((p) => {
            const pTasks = projectTasks(p.id);
            const ok = p.tasks_total <= p.contracted_value;
            const pct = Math.min(100, Math.round((p.tasks_total / p.contracted_value) * 100));

            return (
              <div key={p.id} className="bg-white border border-[var(--border)] rounded-lg overflow-hidden hover:border-[var(--border2)] transition-colors">
                <div className="p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-8 rounded-sm shrink-0" style={{ background: p.color }} />
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-[var(--text)] truncate">{p.name}</div>
                      <div className="text-[11px] text-[var(--muted)]">👤 {p.responsible}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="vbar-track flex-1">
                      <div className="vbar-fill" style={{ width: `${pct}%`, background: ok ? 'var(--sustenta)' : 'var(--autodoc)' }} />
                    </div>
                    <span className="text-[10px] text-[var(--text2)] font-medium">{pct}%</span>
                  </div>

                  <div className="flex justify-between text-[11px] text-[var(--muted)] mb-3">
                    <span>{brl(p.tasks_total)} / {brl(p.contracted_value)}</span>
                    <span>{pTasks.length} tarefas</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {(['fat', 'vis', 'agu', 'apr'] as const).map((s) => {
                      const c = pTasks.filter((t) => t.status === s).length;
                      if (!c) return null;
                      return (
                        <span key={s} className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{
                          background: s === 'fat' ? 'rgba(104,189,76,.1)' : s === 'vis' ? 'rgba(0,139,149,.1)' : s === 'agu' ? 'rgba(241,90,41,.1)' : 'rgba(163,76,157,.1)',
                          color: s === 'fat' ? '#4fa832' : s === 'vis' ? '#007a83' : s === 'agu' ? '#d44e1a' : '#8b3f87',
                        }}>
                          {c} {STATUS_LABELS[s]}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-14 text-[var(--muted)]">
            <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum projeto nesta pasta.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
