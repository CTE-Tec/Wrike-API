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
        <Link href="/projects/demandas" className={navLinkClass('/projects/demandas', pathname)}>
          <FolderOpen size={13} className="nav-icon" />
          <span>1. Demandas</span>
        </Link>
        <Link href="/projects/aprovacao" className={navLinkClass('/projects/aprovacao', pathname)}>
          <FolderOpen size={13} className="nav-icon" />
          <span>2. Projetos em Aprovação</span>
        </Link>
        <Link href="/faturamento" className={navLinkClass('/faturamento', pathname)}>
          <Folder size={13} className="nav-icon" />
          <span>3. Projetos Ativos | Desen…</span>
        </Link>
        <Link href="/projects/implantados" className={navLinkClass('/projects/implantados', pathname)}>
          <FolderOpen size={13} className="nav-icon" />
          <span>4. Projetos Implantados</span>
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
