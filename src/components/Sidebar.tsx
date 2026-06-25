'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FileSpreadsheet, LogOut, ChevronDown, FolderClosed, Search, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from './Toast';
import { useState, useEffect } from 'react';
import { fetchProjects } from '../lib/data';
import type { Project } from '../lib/types';

const useMockData = process.env.NEXT_PUBLIC_USE_MOCKS === 'true' || !supabase;

function navLinkClass(path: string, currentPath: string) {
  return `nav-item${path === currentPath ? ' active' : ''}`;
}

export default function Sidebar() {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const currentProjectId = searchParams?.get('projectId') || '';

  const [projects, setProjects] = useState<Project[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadProjects() {
      try {
        const p = await fetchProjects();
        setProjects(p);
      } catch (err) {
        console.error('Error fetching projects in sidebar:', err);
      }
    }
    loadProjects();
  }, []);

  // Filter projects by search query
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <nav className="sidebar">
      <div className="sb-section">
        <div className="sb-title">Planilha Financeira</div>
        <Link href="/faturamento" className={navLinkClass('/faturamento', pathname)}>
          <FileSpreadsheet size={13} className="nav-icon text-emerald-500" />
          <span className="font-semibold text-emerald-400">Início</span>
        </Link>
        <Link href="/clientes" className={navLinkClass('/clientes', pathname)}>
          <Users size={13} className="nav-icon text-sky-500" />
          <span className="font-semibold text-sky-400">Clientes</span>
        </Link>
      </div>

      <div className="sb-hr" />

      {/* Collapsible Projects Section */}
      <div className="sb-section">
        <div className="flex items-center justify-between px-2 mb-1">
          <Link href="/projetos" className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#3f6878] hover:text-[#c8dfe9] transition no-underline">
            <FolderClosed size={11} className="text-[#3f6878]" />
            <span>Projetos</span>
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-[#3f6878] hover:text-[#c8dfe9] hover:bg-slate-800/30 rounded transition"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            title={isOpen ? 'Recolher projetos' : 'Expandir projetos'}
          >
            <ChevronDown size={12} className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isOpen && (
          <div className="mt-2 pl-2 pr-1 space-y-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-500">
                <Search size={10} />
              </span>
              <input
                type="text"
                placeholder="Buscar projeto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#001725] border border-slate-700/50 rounded pl-7 pr-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500/50"
              />
            </div>
            <div className="max-h-56 overflow-y-auto space-y-0.5 custom-sidebar-scroll pr-1">
              {filteredProjects.map((p) => {
                const isActive = pathname === '/faturamento' && currentProjectId === p.id;
                return (
                  <Link
                    key={p.id}
                    href={`/faturamento?projectId=${p.id}`}
                    className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded truncate transition no-underline ${
                      isActive
                        ? 'bg-[#004d6d] text-white font-semibold'
                        : 'text-slate-400 hover:bg-[#00354e]/50 hover:text-slate-200'
                    }`}
                    title={p.name}
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color || '#58595b' }} />
                    <span className="truncate">{p.name}</span>
                  </Link>
                );
              })}
              {filteredProjects.length === 0 && (
                <div className="text-slate-500 text-[11px] italic py-1 px-2">Nenhum projeto</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="sb-section mt-auto">
        {!useMockData && (
          <button
            onClick={async () => {
              if (supabase) {
                await supabase.auth.signOut();
                showToast('OK', 'Sessao encerrada', 'Voce saiu da sua conta com sucesso.', 'to');
              }
            }}
            className="nav-item w-full text-left mt-2 border-t border-slate-700/20 pt-2 hover:text-red-400 flex items-center gap-1.5"
            style={{ background: 'transparent', cursor: 'pointer' }}
          >
            <LogOut size={13} className="nav-icon text-red-500" />
            <span className="text-red-400">Sair da Conta</span>
          </button>
        )}
      </div>
    </nav>
  );
}
