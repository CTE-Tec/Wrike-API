'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Inbox,
  LayoutDashboard,
  CheckSquare,
  FolderOpen,
  Settings,
  Link2,
  LogOut,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from './Toast';

const useMockData = process.env.NEXT_PUBLIC_USE_MOCKS === 'true' || !supabase;


function navLinkClass(path: string, currentPath: string) {
  return `nav-item${path === currentPath ? ' active' : ''}`;
}

export default function Sidebar() {
  const pathname = usePathname() || '/';

  return (
    <nav className="sidebar">
      <div className="sb-section">
        <Link href="/" className={navLinkClass('/', pathname)}>
          <Search size={13} className="nav-icon" />
          <span>Pesquisar</span>
        </Link>
        <Link href="/inbox" className={navLinkClass('/inbox', pathname)}>
          <Inbox size={13} className="nav-icon" />
          <span>Caixa de entrada</span>
          <span className="nav-badge">8</span>
        </Link>
        <Link href="/dashboard" className={navLinkClass('/dashboard', pathname)}>
          <LayoutDashboard size={13} className="nav-icon" />
          <span>Painéis</span>
        </Link>
        <Link href="/my-tasks" className={navLinkClass('/my-tasks', pathname)}>
          <CheckSquare size={13} className="nav-icon" />
          <span>Minhas tarefas</span>
        </Link>
      </div>
      <div className="sb-hr" />
      <div className="sb-section">
        <div className="sb-title">Navegação Principal</div>
        <Link href="/clientes" className={navLinkClass('/clientes', pathname)}>
          <FolderOpen size={13} className="nav-icon" />
          <span>Clientes</span>
        </Link>
        <Link href="/projetos" className={navLinkClass('/projetos', pathname)}>
          <FolderOpen size={13} className="nav-icon" />
          <span>Projetos</span>
        </Link>
        <Link href="/equipe" className={navLinkClass('/equipe', pathname)}>
          <FolderOpen size={13} className="nav-icon" />
          <span>Equipe</span>
        </Link>
        <Link href="/ficha-cliente" className={navLinkClass('/ficha-cliente', pathname)}>
          <FolderOpen size={13} className="nav-icon" />
          <span>Ficha do Cliente</span>
        </Link>
      </div>
      <div className="sb-hr" />
      <div className="sb-section">
        <div className="sb-title">Financeiro & Faturamento</div>
        <Link href="/faturamento" className={navLinkClass('/faturamento', pathname)}>
          <FolderOpen size={13} className="nav-icon text-emerald-500" />
          <span className="font-semibold text-emerald-400">Fluxo Financeiro</span>
        </Link>
        <Link href="/contratos" className={navLinkClass('/contratos', pathname)}>
          <FolderOpen size={13} className="nav-icon text-sky-500" />
          <span>Gestão de Contratos</span>
        </Link>
        <Link href="/cadastro-faturamento" className={navLinkClass('/cadastro-faturamento', pathname)}>
          <FolderOpen size={13} className="nav-icon text-purple-500" />
          <span>Perfil de Faturamento</span>
        </Link>
      </div>
      <div className="sb-hr" />
      <div className="sb-section">
        <div className="sb-title">Ferramentas</div>
        <Link href="/settings" className={navLinkClass('/settings', pathname)}>
          <Settings size={13} className="nav-icon" />
          <span>Configurações</span>
        </Link>
        <Link href="/integrations" className={navLinkClass('/integrations', pathname)}>
          <Link2 size={13} className="nav-icon" />
          <span>Integrações n8n</span>
        </Link>
        
        {/* Logout button */}
        {!useMockData && (
          <button 
            onClick={async () => {
              if (supabase) {
                await supabase.auth.signOut();
                showToast('🔑', 'Sessão Encerrada', 'Você saiu da sua conta com sucesso.', 'to');
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
