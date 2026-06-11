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

  // Filters and sorting
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

  // Filter projects by name
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.client && p.client.toLowerCase().includes(search.toLowerCase())) ||
    (p.label_code && p.label_code.toLowerCase().includes(search.toLowerCase()))
  );

  // Sort projects by name
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1;
    if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1;
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

  const handleSortChange = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
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

  const startItemIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItemIndex = Math.min(totalItems, currentPage * pageSize);

  return (
    <Layout
      breadcrumb={[
        { label: 'Inteligência Artificial | Projetos' },
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

          {/* Controls: Search, Sort */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
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

            {/* Sort Toggle Button */}
            <button
              onClick={handleSortChange}
              className="inline-flex items-center gap-1.5 bg-white border border-[var(--border2)] rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--text2)] hover:bg-[var(--surface2)] shadow-sm transition"
            >
              <ArrowUpDown size={13} />
              Ordenar: {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
            </button>
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
                    <th className="py-3 px-4 text-left font-bold text-[var(--muted)] tracking-wider">RÓTULO</th>
                    <th className="py-3 px-4 text-left font-bold text-[var(--muted)] tracking-wider">PROJETO</th>
                    <th className="py-3 px-4 text-left font-bold text-[var(--muted)] tracking-wider">CLIENTE</th>
                    <th className="py-3 px-4 text-left font-bold text-[var(--muted)] tracking-wider">RESPONSÁVEL (OWNER)</th>
                    <th className="py-3 px-4 text-right font-bold text-[var(--muted)] tracking-wider">VALOR CONTRATADO</th>
                    <th className="py-3 px-4 text-center font-bold text-[var(--muted)] tracking-wider">MARGEM</th>
                    <th className="py-3 px-4 text-center font-bold text-[var(--muted)] tracking-wider">STATUS</th>
                    <th className="py-3 px-4 text-center font-bold text-[var(--muted)] tracking-wider w-36">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {displayedProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--surface2)] transition">
                      <td className="py-3.5 px-4 text-center">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color || '#58595b' }} />
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[var(--text2)]">{p.label_code || '—'}</td>
                      <td className="py-3.5 px-4 font-bold text-[var(--text)] truncate max-w-xs" title={p.name}>
                        {p.name}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text2)]">{p.client || '—'}</td>
                      <td className="py-3.5 px-4 text-purple-700 font-semibold">👤 {p.owner || 'Sem Owner'}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[var(--text)]">
                        {brl(p.contracted_value)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-amber-700">{p.margin_pct}%</td>
                      <td className="py-3.5 px-4 text-center">
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
                      <td className="py-3.5 px-4 text-center">
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
                      <td colSpan={9} className="py-8 text-center text-slate-500 font-semibold">
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
