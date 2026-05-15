import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import { fetchProjects, fetchTasks, brl } from '../lib/data';
import type { Project, Task } from '../lib/types';
import { CTE_COLORS, STATUS_LABELS } from '../lib/types';
import Layout from '../components/Layout';
import { TrendingUp, AlertTriangle, CheckCircle2, Clock, DollarSign } from 'lucide-react';

const PIE_COLORS = [CTE_COLORS.sustenta, CTE_COLORS.enredes, CTE_COLORS.qualtech, CTE_COLORS.gerencia];

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    Promise.all([fetchProjects(), fetchTasks()]).then(([p, t]) => {
      setProjects(p);
      setTasks(t);
    });
  }, []);

  const totalFaturar = tasks.filter((t) => t.status === 'fat').reduce((s, t) => s + t.value, 0);
  const totalAprovado = tasks.filter((t) => t.status === 'apr').reduce((s, t) => s + t.value, 0);
  const totalAguardando = tasks.filter((t) => t.status === 'agu').length;
  const totalVisualizacao = tasks.filter((t) => t.status === 'vis').length;
  const alertCount = projects.filter((p) => p.tasks_total > p.contracted_value).length;

  const statusData = (['fat', 'vis', 'agu', 'apr'] as const).map((s) => ({
    name: STATUS_LABELS[s],
    value: tasks.filter((t) => t.status === s).length,
  }));

  const projectValueData = projects.map((p) => ({
    name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name,
    contratado: Number(p.contracted_value),
    faturado: Number(p.tasks_total),
  }));

  const monthlyData = [
    { mes: 'Jan', valor: 45000 },
    { mes: 'Fev', valor: 78000 },
    { mes: 'Mar', valor: 62000 },
    { mes: 'Abr', valor: 95000 },
    { mes: 'Mai', valor: 110000 },
    { mes: 'Jun', valor: 88000 },
    { mes: 'Jul', valor: 125000 },
    { mes: 'Ago', valor: 97000 },
    { mes: 'Set', valor: 140000 },
    { mes: 'Out', valor: 115000 },
    { mes: 'Nov', valor: 132000 },
    { mes: 'Dez', valor: 150000 },
  ];

  return (
    <Layout breadcrumb={[
      { label: 'Inteligência Artificial | Projetos' },
      { label: 'Painéis' },
      { label: 'Dashboard', active: true },
    ]}>
      <div className="kpi-strip">
        <div className="kpi-box kb-green">
          <div className="kpi-lbl"><DollarSign size={12} className="inline mr-1" />Total a Faturar</div>
          <div className="kpi-val">{brl(totalFaturar)}</div>
          <div className="kpi-sub">{tasks.filter((t) => t.status === 'fat').length} tarefas prontas</div>
        </div>
        <div className="kpi-box kb-teal">
          <div className="kpi-lbl"><TrendingUp size={12} className="inline mr-1" />Em Visualização</div>
          <div className="kpi-val">{totalVisualizacao}</div>
          <div className="kpi-sub">tarefas em andamento</div>
        </div>
        <div className="kpi-box kb-orange">
          <div className="kpi-lbl"><Clock size={12} className="inline mr-1" />Aguard. Aprovação</div>
          <div className="kpi-val">{totalAguardando}</div>
          <div className="kpi-sub">aguardando resposta</div>
        </div>
        <div className="kpi-box kb-purple">
          <div className="kpi-lbl"><CheckCircle2 size={12} className="inline mr-1" />Aprovados</div>
          <div className="kpi-val">{brl(totalAprovado)}</div>
          <div className="kpi-sub">{tasks.filter((t) => t.status === 'apr').length} tarefas aprovadas</div>
        </div>
        <div className="kpi-box kb-red">
          <div className="kpi-lbl"><AlertTriangle size={12} className="inline mr-1" />Alertas de Valor</div>
          <div className="kpi-val">{alertCount}</div>
          <div className="kpi-sub">projetos com divergência</div>
        </div>
      </div>

      <div className="p-3.5 grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <div className="bg-white border border-[var(--border)] rounded-lg p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Valor Faturado por Mês</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text2)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text2)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => brl(Number(v))} />
              <Area type="monotone" dataKey="valor" stroke={CTE_COLORS.enredes} fill="rgba(0,139,149,.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-lg p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Tarefas por Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-lg p-4 lg:col-span-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Valor Contratado vs Faturado por Projeto</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={projectValueData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text2)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11, fill: 'var(--text2)' }} />
              <Tooltip formatter={(v) => brl(Number(v))} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="contratado" fill={CTE_COLORS.cte2} name="Contratado" radius={[0, 3, 3, 0]} />
              <Bar dataKey="faturado" fill={CTE_COLORS.qualtech} name="Faturado" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
}
