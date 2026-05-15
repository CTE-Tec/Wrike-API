'use client';

import { useState, useEffect } from 'react';
import { fetchProjects, fetchTasks, brl } from '../lib/data';
import type { Project, Task } from '../lib/types';
import Layout from '../components/Layout';
import StatusPill from '../components/StatusPill';
import { Search as SearchIcon } from 'lucide-react';

export default function Search() {
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    Promise.all([fetchProjects(), fetchTasks()]).then(([p, t]) => {
      setProjects(p);
      setTasks(t);
    });
  }, []);

  const term = query.toLowerCase();
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

  const matchedTasks = term
    ? tasks.filter((t) => t.name.toLowerCase().includes(term) || t.description.toLowerCase().includes(term))
    : [];

  const matchedProjects = term
    ? projects.filter((p) => p.name.toLowerCase().includes(term) || p.responsible.toLowerCase().includes(term))
    : [];

  return (
    <Layout
      breadcrumb={[
        { label: 'Pesquisar', active: true },
      ]}
    >
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="relative mb-6">
          <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Pesquisar projetos, tarefas, responsáveis…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white border border-[var(--border2)] rounded-lg pl-11 pr-4 py-3 text-[14px] text-[var(--text)] outline-none focus:border-[var(--cte2)] transition-colors"
            autoFocus
          />
        </div>

        {!term && (
          <div className="text-center py-14 text-[var(--muted)]">
            <SearchIcon size={40} className="mx-auto mb-3 opacity-30" />
            <p>Digite para pesquisar em projetos e tarefas.</p>
          </div>
        )}

        {term && matchedProjects.length > 0 && (
          <div className="mb-6">
            <h3 className="sec-hdr mb-2">Projetos ({matchedProjects.length})</h3>
            {matchedProjects.map((p) => (
              <div key={p.id} className="bg-white border border-[var(--border)] rounded-lg p-3 mb-2 flex items-center gap-3">
                <div className="w-2.5 h-8 rounded-sm shrink-0" style={{ background: p.color }} />
                <div>
                  <div className="text-[13px] font-semibold text-[var(--text)]">{p.name}</div>
                  <div className="text-[11px] text-[var(--muted)]">👤 {p.responsible} · 💰 {brl(p.contracted_value)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {term && matchedTasks.length > 0 && (
          <div>
            <h3 className="sec-hdr mb-2">Tarefas ({matchedTasks.length})</h3>
            {matchedTasks.map((t) => {
              const proj = projectMap[t.project_id];
              return (
                <div key={t.id} className="bg-white border border-[var(--border)] rounded-lg p-3 mb-2 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[var(--text)]">{t.name}</div>
                    <div className="text-[11px] text-[var(--muted)]">{proj?.name} · {brl(t.value)}</div>
                  </div>
                  <StatusPill status={t.status} />
                </div>
              );
            })}
          </div>
        )}

        {term && matchedProjects.length === 0 && matchedTasks.length === 0 && (
          <div className="text-center py-14 text-[var(--muted)]">
            <p>Nenhum resultado para "{query}".</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
