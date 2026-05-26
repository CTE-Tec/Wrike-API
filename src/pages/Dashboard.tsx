'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { fetchProjects, fetchTasks, brl } from '../lib/data';
import type { Project, Task } from '../lib/types';
import { CTE_COLORS } from '../lib/types';
import Layout from '../components/Layout';
import { AlertTriangle, CheckCircle2, Clock, DollarSign, Filter, Award } from 'lucide-react';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string>('all');

  useEffect(() => {
    Promise.all([fetchProjects(), fetchTasks()]).then(([p, t]) => {
      setProjects(p);
      setTasks(t);
    });
  }, []);

  // Filter projects/tasks by Owner
  const filteredProjects = selectedOwner === 'all' 
    ? projects 
    : projects.filter(p => p.owner === selectedOwner);

  const filteredProjectIds = filteredProjects.map(p => p.id);

  const filteredTasks = selectedOwner === 'all'
    ? tasks
    : tasks.filter(t => filteredProjectIds.includes(t.project_id));

  // Unique owners list
  const owners = Array.from(new Set(projects.map(p => p.owner)));

  // Invoicing Progress metrics
  const totalPrevisto = filteredTasks.reduce((s, t) => s + t.value, 0);
  const aFaturar = filteredTasks.filter(t => t.status === 'fat').reduce((s, t) => s + t.value, 0);
  const medido = filteredTasks.filter(t => t.status === 'agu').reduce((s, t) => s + t.value, 0);
  const faturado = filteredTasks.filter(t => t.status === 'vis').reduce((s, t) => s + t.value, 0);
  const recebido = filteredTasks.filter(t => t.status === 'apr').reduce((s, t) => s + t.value, 0);

  // SLA calculations
  const totalFlows = filteredProjects.length;
  const approvedFlows = filteredProjects.filter(p => p.approved_by_owner).length;
  const approvalSLA = totalFlows > 0 ? Math.round((approvedFlows / totalFlows) * 100) : 100;
  
  // Measurement SLA (mocked calculation for this cycle)
  const measurementSLA = 94; // 94% on-time delivery

  // Stacked horizontal progress bar data
  const progressData = [
    {
      name: 'Fluxo Financeiro',
      'Recebido': recebido,
      'Faturado': faturado,
      'Medido': medido,
      'A Faturar': aFaturar,
    }
  ];

  // Projects value comparison
  const projectComparisonData = filteredProjects.map(p => {
    const pTasks = tasks.filter(t => t.project_id === p.id);
    return {
      name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name,
      'Original Contrato': p.contract_original_value,
      'Total Planejado': pTasks.reduce((s, t) => s + t.value, 0),
    };
  });

  return (
    <Layout breadcrumb={[
      { label: 'Inteligência Artificial | Projetos' },
      { label: 'Painéis' },
      { label: 'Dashboard Executivo', active: true },
    ]}>
      {/* Top filter area */}
      <div className="bg-white border-b border-[var(--border)] p-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[var(--muted)]" />
          <span className="text-xs font-semibold text-[var(--text2)]">Filtrar por Líder de Projeto:</span>
          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className="bg-[var(--surface2)] border border-[var(--border2)] rounded px-2.5 py-1 text-xs outline-none text-[var(--text)] font-semibold"
          >
            <option value="all">Todos os Líderes</option>
            {owners.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div className="text-xs text-[var(--muted)]">
          Dados consolidados da sprint financeira corrente.
        </div>
      </div>

      {/* Primary KPI Blocks */}
      <div className="kpi-strip">
        <div className="kpi-box kb-teal">
          <div className="kpi-lbl"><DollarSign size={12} className="inline mr-1" />Total Planejado</div>
          <div className="kpi-val">{brl(totalPrevisto)}</div>
          <div className="kpi-sub">{filteredTasks.length} parcelas registradas</div>
        </div>
        <div className="kpi-box kb-orange">
          <div className="kpi-lbl"><Clock size={12} className="inline mr-1" />Total a Faturar</div>
          <div className="kpi-val">{brl(aFaturar)}</div>
          <div className="kpi-sub">pronto para medição</div>
        </div>
        <div className="kpi-box kb-green">
          <div className="kpi-lbl"><CheckCircle2 size={12} className="inline mr-1" />Total Recebido</div>
          <div className="kpi-val">{brl(recebido)}</div>
          <div className="kpi-sub">faturamento quitado</div>
        </div>
        <div className="kpi-box kb-purple">
          <div className="kpi-lbl"><Award size={12} className="inline mr-1" />SLA Aprovação</div>
          <div className="kpi-val">{approvalSLA}%</div>
          <div className="kpi-sub">{approvedFlows} de {totalFlows} fluxos fechados</div>
        </div>
        <div className="kpi-box kb-red">
          <div className="kpi-lbl"><AlertTriangle size={12} className="inline mr-1" />Alertas Críticos</div>
          <div className="kpi-val">{filteredProjects.filter(p => p.is_critical).length}</div>
          <div className="kpi-sub">próximos do limite de faturamento</div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Main stacked horizontal chart */}
        <div className="bg-white border border-[var(--border)] rounded-xl p-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Progresso de Faturamento Mensal (Barras Acumuladas)</h3>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={progressData} layout="vertical" stackOffset="expand">
              <XAxis type="number" tickFormatter={(v) => `${Math.round(v * 100)}%`} hide />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip formatter={(v) => brl(Number(v))} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Recebido" stackId="a" fill={CTE_COLORS.sustenta} radius={[4, 0, 0, 4]} />
              <Bar dataKey="Faturado" stackId="a" fill={CTE_COLORS.enredes} />
              <Bar dataKey="Medido" stackId="a" fill={CTE_COLORS.qualtech} />
              <Bar dataKey="A Faturar" stackId="a" fill={CTE_COLORS.cte4} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-4 gap-2 mt-4 text-center text-xs">
            <div>
              <div className="text-[10px] text-[var(--muted)] font-bold uppercase">Já Recebido</div>
              <div className="font-bold text-green-700">{brl(recebido)}</div>
            </div>
            <div>
              <div className="text-[10px] text-[var(--muted)] font-bold uppercase">Já Faturado</div>
              <div className="font-bold text-teal-700">{brl(faturado)}</div>
            </div>
            <div>
              <div className="text-[10px] text-[var(--muted)] font-bold uppercase">Já Medido</div>
              <div className="font-bold text-orange-700">{brl(medido)}</div>
            </div>
            <div>
              <div className="text-[10px] text-[var(--muted)] font-bold uppercase font-medium">A Faturar</div>
              <div className="font-bold text-slate-700">{brl(aFaturar)}</div>
            </div>
          </div>
        </div>

        {/* SLA Gauges & Project value charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* SLA Gauges */}
          <div className="bg-white border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Indicadores de SLA</h3>
            
            <div className="border border-[var(--border)] rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[var(--text)]">SLA aprovação de fluxo</div>
                <div className="text-[10px] text-[var(--muted)]">Líderes aprovando até dia 25</div>
              </div>
              <div className="text-lg font-black text-purple-700">{approvalSLA}%</div>
            </div>

            <div className="border border-[var(--border)] rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[var(--text)]">SLA de medição</div>
                <div className="text-[10px] text-[var(--muted)]">Entregues no prazo do cliente</div>
              </div>
              <div className="text-lg font-black text-teal-700">{measurementSLA}%</div>
            </div>

            <div className="border border-[var(--border)] rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[var(--text)]">Grau de Completude</div>
                <div className="text-[10px] text-[var(--muted)]">Fluxos aprovados no mês</div>
              </div>
              <div className="text-lg font-black text-amber-700">{approvedFlows} / {totalFlows}</div>
            </div>
          </div>

          {/* Planned vs Contracted Chart */}
          <div className="bg-white border border-[var(--border)] rounded-xl p-4 shadow-sm lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Valor Contratado vs Total Planejado</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={projectComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text2)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => brl(Number(v))} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Original Contrato" fill={CTE_COLORS.cte2} name="Valor Contratado" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Total Planejado" fill={CTE_COLORS.gerencia} name="Total Planejado" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Critical projects table summary */}
        <div className="bg-white border border-[var(--border)] rounded-xl p-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Projetos com Risco / Fluxos Críticos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--surface2)] text-[var(--muted)] font-bold">
                  <th className="py-2 pl-3 text-left">Projeto</th>
                  <th className="py-2 text-left">Líder</th>
                  <th className="py-2 text-center">Data Limite</th>
                  <th className="py-2 text-right">Valor Planejado</th>
                  <th className="py-2 text-center">SLA Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.filter(p => p.is_critical).map(p => (
                  <tr key={p.id} className="border-b border-[var(--border)] hover:bg-purple-500/5">
                    <td className="py-2 pl-3 font-semibold text-purple-900">{p.name}</td>
                    <td className="py-2">👤 {p.owner}</td>
                    <td className="py-2 text-center font-bold text-red-600">{p.flow_date}</td>
                    <td className="py-2 text-right font-bold">{brl(p.total_planned_value)}</td>
                    <td className="py-2 text-center">
                      <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-[9px] uppercase">Risco de SLA</span>
                    </td>
                  </tr>
                ))}
                {filteredProjects.filter(p => p.is_critical).length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-[var(--muted)]">Nenhum fluxo crítico sob risco no momento.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
