'use client';

import { useEffect, useState } from 'react';
import { fetchProjects, fetchTasks, brl } from '../lib/data';
import type { Project, Task } from '../lib/types';
import { STATUS_LABELS } from '../lib/types';
import Layout from '../components/Layout';
import { FolderOpen, Folder } from 'lucide-react';
import { useParams } from 'next/navigation';
import React from 'react';

const FOLDER_META: Record<string, { title: string; icon: React.ReactNode; desc: string }> = {
  projetos: { title: 'Projetos', icon: <FolderOpen size={16} />, desc: 'Todos os projetos com parcelas e entregáveis' },
  'gestao-de-fluxos': { title: 'Gestão de Fluxos', icon: <FolderOpen size={16} />, desc: 'Demandas recebidas e em triagem' },
  'fluxos-liberados': { title: 'Fluxos Liberados', icon: <FolderOpen size={16} />, desc: 'Projetos com fluxos liberados' },
  'fluxos-concluidos': { title: 'Fluxos Concluídos', icon: <Folder size={16} />, desc: 'Fluxos já concluídos' },
};

export default function Projects() {
  const params = useParams<{ folder?: string }>();
  const folder = params?.folder ?? 'projetos';
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  useEffect(() => {
    Promise.all([fetchProjects(), fetchTasks()]).then(([p, t]) => {
      setProjects(p);
      setTasks(t);
    });
  }, []);

  const meta = FOLDER_META[folder] || FOLDER_META['projetos'];
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

        <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[var(--surface3)] border-b border-[var(--border2)]">
                <th className="p-3 px-4 text-left font-bold text-[var(--muted)] uppercase text-[11px] tracking-wider">Projeto</th>
                <th className="p-3 px-4 text-left font-bold text-[var(--muted)] uppercase text-[11px] tracking-wider">Valor Total a Faturar (liberado)</th>
                <th className="p-3 px-4 text-left font-bold text-[var(--muted)] uppercase text-[11px] tracking-wider">Data Limite para medição</th>
                <th className="p-3 px-4 text-left font-bold text-[var(--muted)] uppercase text-[11px] tracking-wider">Líder do Projeto</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const pTasks = projectTasks(p.id);
                const fatTasks = pTasks.filter(t => t.status === 'fat');
                const fatTotal = fatTasks.reduce((acc, t) => acc + t.value, 0);
                
                let limitDate = '25';
                if (fatTasks.length > 0) {
                  const dates = fatTasks.map(t => t.due_date ? new Date(t.due_date).getTime() : Infinity).filter(d => d !== Infinity);
                  if (dates.length > 0) {
                    const minDate = new Date(Math.min(...dates));
                    limitDate = minDate.getDate().toString().padStart(2, '0');
                  }
                }

                const open = !collapsed.has(p.id);

                return (
                  <React.Fragment key={p.id}>
                    <tr 
                      onClick={() => toggle(p.id)} 
                      className="border-b border-[var(--border)] hover:bg-[var(--surface2)] cursor-pointer transition-colors"
                    >
                      <td className="p-3 px-4 font-bold text-[var(--text)]">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-5 rounded-sm shrink-0" style={{ background: p.color || '#999' }} />
                          {p.name}
                        </div>
                      </td>
                      <td className="p-3 px-4 font-mono text-[var(--sustenta)] font-semibold">{brl(fatTotal)}</td>
                      <td className="p-3 px-4 text-[var(--text2)]">Dia {limitDate}</td>
                      <td className="p-3 px-4 text-[var(--text2)]">👤 {p.responsible}</td>
                    </tr>
                    
                    {open && (
                      <tr className="bg-[var(--surface2)] border-b border-[var(--border)]">
                        <td colSpan={4} className="p-0">
                          <div className="p-5 border-l-4" style={{ borderColor: p.color || '#999' }}>
                            <table className="w-full text-[12px] bg-white rounded border border-[var(--border)] shadow-sm">
                              <thead>
                                <tr className="bg-[var(--surface3)] border-b border-[var(--border)]">
                                  <th className="text-left text-[var(--muted)] p-2 px-3 font-semibold uppercase text-[10px]">Tarefa / Parcela</th>
                                  <th className="text-left text-[var(--muted)] p-2 px-3 font-semibold uppercase text-[10px]">Status</th>
                                  <th className="text-left text-[var(--muted)] p-2 px-3 font-semibold uppercase text-[10px]">Valor</th>
                                  <th className="text-left text-[var(--muted)] p-2 px-3 font-semibold uppercase text-[10px]">Vencimento</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pTasks.map((t) => (
                                  <tr key={t.id} className="border-b border-[var(--border2)] last:border-0 hover:bg-[var(--surface2)]">
                                    <td className="p-2 px-3">
                                      <div className="font-medium text-[var(--text)]">{t.name}</div>
                                      <div className="text-[10px] text-[var(--muted)]">{t.description}</div>
                                    </td>
                                    <td className="p-2 px-3">
                                      <span className="pill" style={{
                                        background: t.status === 'fat' ? 'rgba(104,189,76,.14)' : t.status === 'vis' ? 'rgba(0,139,149,.14)' : t.status === 'agu' ? 'rgba(241,90,41,.14)' : 'rgba(163,76,157,.14)',
                                        color: t.status === 'fat' ? '#4fa832' : t.status === 'vis' ? '#007a83' : t.status === 'agu' ? '#d44e1a' : '#8b3f87'
                                      }}>
                                        {STATUS_LABELS[t.status]}
                                      </span>
                                    </td>
                                    <td className="p-2 px-3 font-mono text-[var(--sustenta)]">{brl(t.value)}</td>
                                    <td className="p-2 px-3 text-[var(--muted)]">
                                      {t.due_date ? new Date(t.due_date).toLocaleDateString('pt-BR') : '—'}
                                    </td>
                                  </tr>
                                ))}
                                {pTasks.length === 0 && (
                                  <tr>
                                    <td colSpan={4} className="text-center py-4 text-[var(--muted)]">Nenhuma parcela cadastrada.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
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
