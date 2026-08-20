'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import { fetchProjects, brl } from '../../lib/data';
import type { Project } from '../../lib/types';
import { Search, ArrowUpDown, Eye, FolderKanban } from 'lucide-react';

export default function ProjetosPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Global search and column-based filters
  const [search, setSearch] = useState('');
  const [colFilters, setColFilters] = useState({
    label_code: '',
    name: '',
    client: '',
    owner: '',
    contracted_value: '',
    margin_pct: '',
    status: 'all',
    updater: ''
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: keyof Project | 'status' | 'updater'; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    async function loadProjects() {
      try {
        const p = await fetchProjects();
        setProjects(p);
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  // Filter projects by global search and individual column filters
  const filteredProjects = projects.filter(p => {
    // 1. Global search matches label, client or name
    const matchesGlobal = search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.client && p.client.toLowerCase().includes(search.toLowerCase())) ||
      (p.label_code && p.label_code.toLowerCase().includes(search.toLowerCase()));

    if (!matchesGlobal) return false;

    // 2. Individual column filters
    const matchesLabel = colFilters.label_code === '' ||
      (p.label_code && p.label_code.toLowerCase().includes(colFilters.label_code.toLowerCase()));

    const matchesName = colFilters.name === '' ||
      p.name.toLowerCase().includes(colFilters.name.toLowerCase());

    const matchesClient = colFilters.client === '' ||
      (p.client && p.client.toLowerCase().includes(colFilters.client.toLowerCase()));

    const matchesOwner = colFilters.owner === '' ||
      (p.owner && p.owner.toLowerCase().includes(colFilters.owner.toLowerCase()));

    const matchesContracted = colFilters.contracted_value === '' ||
      String(p.contracted_value).includes(colFilters.contracted_value) ||
      brl(p.contracted_value).toLowerCase().includes(colFilters.contracted_value.toLowerCase());

    const matchesMargin = colFilters.margin_pct === '' ||
      String(p.margin_pct).includes(colFilters.margin_pct);

    const matchesStatus = colFilters.status === 'all' ||
      (colFilters.status === 'aprovado' && p.approved_by_owner) ||
      (colFilters.status === 'pendente' && !p.approved_by_owner);

    const latestUpdater = p.latest_status_event?.actor_name || '';
    const matchesUpdater = colFilters.updater === '' ||
      latestUpdater.toLowerCase().includes(colFilters.updater.toLowerCase());

    return matchesLabel && matchesName && matchesClient && matchesOwner && matchesContracted && matchesMargin && matchesStatus && matchesUpdater;
  });

  // Sort projects based on sortConfig
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;

    let valA: any = '';
    let valB: any = '';

    if (key === 'status') {
      valA = a.approved_by_owner ? 1 : 0;
      valB = b.approved_by_owner ? 1 : 0;
    } else if (key === 'updater') {
      valA = (a.latest_status_event?.actor_name || '').toLowerCase();
      valB = (b.latest_status_event?.actor_name || '').toLowerCase();
    } else {
      const fieldValA = a[key as keyof Project];
      const fieldValB = b[key as keyof Project];
      valA = typeof fieldValA === 'string' ? fieldValA.toLowerCase() : fieldValA;
      valB = typeof fieldValB === 'string' ? fieldValB.toLowerCase() : fieldValB;
    }

    if (valA == null) return direction === 'asc' ? 1 : -1;
    if (valB == null) return direction === 'asc' ? -1 : 1;

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginated projects
  const totalItems = sortedProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const displayedProjects = sortedProjects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page when filters change
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleColFilterChange = (column: keyof typeof colFilters, val: string) => {
    setColFilters(prev => ({ ...prev, [column]: val }));
    setCurrentPage(1);
  };

  const handleSort = (key: keyof Project | 'status' | 'updater') => {
    setSortConfig(prev => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const renderHeader = (label: string, sortKey: keyof Project | 'status' | 'updater', className = '') => {
    const isSorted = sortConfig?.key === sortKey;
    return (
      <th 
        onClick={() => handleSort(sortKey)} 
        className={`py-3 px-4 font-bold text-[var(--muted)] tracking-wider cursor-pointer hover:bg-[var(--surface2)] select-none transition ${className}`}
      >
        <div className={`flex items-center gap-1 ${className.includes('text-right') ? 'justify-end' : className.includes('text-center') ? 'justify-center' : 'justify-start'}`}>
          <span>{label}</span>
          <ArrowUpDown size={11} className={`shrink-0 ${isSorted ? 'text-sky-600 font-bold' : 'text-slate-300'}`} />
        </div>
      </th>
    );
  };

  const startItemIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItemIndex = Math.min(totalItems, currentPage * pageSize);

  return (
    <Layout
      breadcrumb={[
        { label: 'Projetos' },
        { label: 'Financeiro' },
        { label: 'Projetos', active: true },
      ]}
    >
      <div className="p-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-[var(--text)] flex items-center gap-2">
              <FolderKanban size={20} className="text-sky-500" />
              Projetos Cadastrados
            </h1>
            <p className="text-xs text-[var(--muted)] mt-1">
              Gerencie e visualize o fluxo financeiro de todos os projetos ativos.
            </p>
          </div>

          {/* Controls: Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Buscar por nome, cliente ou rótulo..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="bg-white border border-[var(--border2)] rounded-lg pl-9 pr-4 py-1.5 text-xs text-[var(--text)] placeholder-slate-400 outline-none focus:border-sky-500 w-64 shadow-sm"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-[var(--border)] rounded-xl shadow-sm p-12 text-center">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <span className="text-xs text-[var(--muted)] font-bold">Carregando Projetos...</span>
          </div>
        ) : (
          <div className="bg-white border border-[var(--border)] rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-[var(--surface3)] border-b border-[var(--border2)]">
                    <th className="py-3 px-4 text-left font-bold text-[var(--muted)] tracking-wider w-8"></th>
                    {renderHeader('RÓTULO', 'label_code')}
                    {renderHeader('PROJETO', 'name')}
                    {renderHeader('CLIENTE', 'client')}
                    {renderHeader('RESPONSÁVEL (OWNER)', 'owner')}
                    {renderHeader('VALOR CONTRATADO', 'contracted_value', 'text-right')}
                    {renderHeader('MARGEM', 'margin_pct', 'text-center')}
                    {renderHeader('STATUS', 'status', 'text-center')}
                    {renderHeader('ÚLT. ATUALIZAÇÃO', 'updater')}
                    <th className="py-3 px-4 text-center font-bold text-[var(--muted)] tracking-wider w-36">AÇÕES</th>
                  </tr>
                  
                  {/* Column Filters Input Row */}
                  <tr className="bg-[var(--surface2)] border-b border-[var(--border2)]">
                    <th className="py-1.5 px-3"></th>
                    <th className="py-1.5 px-3"><input type="text" placeholder="Filtrar..." value={colFilters.label_code} onChange={(e) => handleColFilterChange('label_code', e.target.value)} className="w-full bg-white border border-[var(--border2)] rounded px-1.5 py-0.5 text-[10px] font-normal focus:border-sky-400 outline-none" /></th>
                    <th className="py-1.5 px-3"><input type="text" placeholder="Filtrar..." value={colFilters.name} onChange={(e) => handleColFilterChange('name', e.target.value)} className="w-full bg-white border border-[var(--border2)] rounded px-1.5 py-0.5 text-[10px] font-normal focus:border-sky-400 outline-none" /></th>
                    <th className="py-1.5 px-3"><input type="text" placeholder="Filtrar..." value={colFilters.client} onChange={(e) => handleColFilterChange('client', e.target.value)} className="w-full bg-white border border-[var(--border2)] rounded px-1.5 py-0.5 text-[10px] font-normal focus:border-sky-400 outline-none" /></th>
                    <th className="py-1.5 px-3"><input type="text" placeholder="Filtrar..." value={colFilters.owner} onChange={(e) => handleColFilterChange('owner', e.target.value)} className="w-full bg-white border border-[var(--border2)] rounded px-1.5 py-0.5 text-[10px] font-normal focus:border-sky-400 outline-none" /></th>
                    <th className="py-1.5 px-3"><input type="text" placeholder="Filtrar..." value={colFilters.contracted_value} onChange={(e) => handleColFilterChange('contracted_value', e.target.value)} className="w-full bg-white border border-[var(--border2)] rounded px-1.5 py-0.5 text-[10px] font-normal focus:border-sky-400 outline-none text-right" /></th>
                    <th className="py-1.5 px-3"><input type="text" placeholder="Filtrar..." value={colFilters.margin_pct} onChange={(e) => handleColFilterChange('margin_pct', e.target.value)} className="w-full bg-white border border-[var(--border2)] rounded px-1.5 py-0.5 text-[10px] font-normal focus:border-sky-400 outline-none text-center" /></th>
                    <th className="py-1.5 px-3">
                      <select value={colFilters.status} onChange={(e) => handleColFilterChange('status', e.target.value)} className="w-full bg-white border border-[var(--border2)] rounded px-1 px-0.5 text-[10px] font-normal focus:border-sky-400 outline-none">
                        <option value="all">Todos</option>
                        <option value="aprovado">Aprovado</option>
                        <option value="pendente">Pendente</option>
                      </select>
                    </th>
                    <th className="py-1.5 px-3"><input type="text" placeholder="Filtrar..." value={colFilters.updater} onChange={(e) => handleColFilterChange('updater', e.target.value)} className="w-full bg-white border border-[var(--border2)] rounded px-1.5 py-0.5 text-[10px] font-normal focus:border-sky-400 outline-none" /></th>
                    <th className="py-1.5 px-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {displayedProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--surface2)] transition">
                      <td className="py-3 px-4 text-center">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color || '#58595b' }} />
                      </td>
                      <td className="py-3 px-4 font-semibold text-[var(--text2)]">{p.label_code || '—'}</td>
                      <td className="py-3 px-4 font-bold text-[var(--text)] truncate max-w-xs" title={p.name}>
                        {p.name}
                      </td>
                      <td className="py-3 px-4 text-[var(--text2)]">{p.client || '—'}</td>
                      <td className="py-3 px-4 text-purple-700 font-semibold">👤 {p.owner || 'Sem Owner'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[var(--text)]">
                        {brl(p.contracted_value)}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-amber-700">{p.margin_pct}%</td>
                      <td className="py-3 px-4 text-center">
                        {p.approved_by_owner ? (
                          <span className="bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                            Aprovado
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-left">
                        {p.latest_status_event ? (
                          <div className="min-w-0">
                            <span className="font-semibold text-sky-800 text-[10px] uppercase bg-sky-100 px-1 py-0.2 rounded">
                              {p.latest_status_event.action_type === 'measurements_sent'
                                ? 'Medido'
                                : p.latest_status_event.action_type === 'navis_updated'
                                ? 'Navis'
                                : p.latest_status_event.action_type === 'invoices_sent'
                                ? 'Faturado'
                                : 'Pago'}
                            </span>
                            <div className="text-[10px] text-[var(--muted)] leading-tight mt-0.5">
                              Por: <span className="font-medium text-[var(--text2)]">{p.latest_status_event.actor_name}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => router.push(`/faturamento?projectId=${p.id}`)}
                          className="inline-flex items-center gap-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 hover:text-sky-800 font-bold py-1 px-3 rounded text-[11px] transition shadow-sm"
                        >
                          <Eye size={12} />
                          Fluxo
                        </button>
                      </td>
                    </tr>
                  ))}
                  {displayedProjects.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500 font-semibold">
                        Nenhum projeto encontrado para esta busca.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="table-controls border-t border-[var(--border)]">
              <div className="table-page-info">
                Mostrando {startItemIndex}–{endItemIndex} de {totalItems} projetos
              </div>
              <div className="table-page-actions flex items-center gap-3">
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="p-1 px-2 border border-[var(--border2)] rounded hover:bg-[var(--surface2)] disabled:opacity-40 disabled:cursor-not-allowed text-xs transition"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="p-1 px-2 border border-[var(--border2)] rounded hover:bg-[var(--surface2)] disabled:opacity-40 disabled:cursor-not-allowed text-xs transition"
                  >
                    Próxima
                  </button>
                </div>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.currentTarget.value))}
                  className="p-1 border border-[var(--border2)] rounded text-xs bg-white outline-none cursor-pointer"
                >
                  {[10, 25, 50].map((size) => (
                    <option key={size} value={size}>
                      {size} / página
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
