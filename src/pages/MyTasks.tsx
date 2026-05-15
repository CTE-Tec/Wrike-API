'use client';

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
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

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

  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);
  
  const groupedProjects = projects.map(p => {
    return {
      ...p,
      tasks: filteredTasks.filter(t => t.project_id === p.id)
    };
  }).filter(p => p.tasks.length > 0);

  return (
    <Layout
      breadcrumb={[
        { label: 'Inteligência Artificial | Projetos' },
        { label: 'Minhas tarefas', active: true },
      ]}
      toolbar={toolbar}
    >
      <div className="projs-area pt-4">
        {groupedProjects.map((p) => {
          const open = !collapsed.has(p.id);
          const cnt = { fat: 0, vis: 0, agu: 0, apr: 0 } as Record<string, number>;
          p.tasks.forEach((t) => { cnt[t.status] = (cnt[t.status] || 0) + 1; });

          return (
            <div className="pcard" key={p.id}>
              <div className="phead" onClick={() => toggle(p.id)}>
                <div className="p-accent" style={{ background: p.color || '#999' }} />
                <div className="p-info">
                  <div className="p-name">{p.name}</div>
                  <div className="p-meta">
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
              
              {open && (
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Tarefa</th>
                        <th>Status</th>
                        <th>Valor</th>
                        <th>Vencimento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.tasks.map((t) => (
                        <tr key={t.id}>
                          <td className="t-name">
                            <div className="t-n">{t.name}</div>
                            <div className="t-d">{t.description}</div>
                          </td>
                          <td><StatusPill status={t.status} /></td>
                          <td className="mono c-green">{brl(t.value)}</td>
                          <td className="mono c-muted">
                            {t.due_date ? new Date(t.due_date).toLocaleDateString('pt-BR') : '—'}
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
        
        {groupedProjects.length === 0 && (
          <div className="text-center py-14 text-[var(--muted)]">Nenhuma tarefa encontrada.</div>
        )}
      </div>
    </Layout>
  );
}
