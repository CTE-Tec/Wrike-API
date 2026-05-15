'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Inbox,
  LayoutDashboard,
  CheckSquare,
  FolderOpen,
  Folder,
  Settings,
  Link2,
} from 'lucide-react';

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
        <div className="sb-title">Projetos e pastas</div>
        <Link href="/projects/gestao-de-fluxos" className={navLinkClass('/projects/gestao-de-fluxos', pathname)}>
          <FolderOpen size={13} className="nav-icon" />
          <span>GESTÃO DE FLUXOS</span>
        </Link>
        <Link href="/projects/fluxos-liberados" className={navLinkClass('/projects/fluxos-liberados', pathname)}>
          <FolderOpen size={13} className="nav-icon" />
          <span>FLUXOS LIBERADOS</span>
        </Link>
        <Link href="/faturamento" className={navLinkClass('/faturamento', pathname)}>
          <Folder size={13} className="nav-icon" />
          <span>FLUXOS EM ABERTO</span>
        </Link>
        <Link href="/projects/fluxos-concluidos" className={navLinkClass('/projects/fluxos-concluidos', pathname)}>
          <FolderOpen size={13} className="nav-icon" />
          <span>FLUXOS CONCLUÍDOS</span>
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
      </div>
    </nav>
  );
}
