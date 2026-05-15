import { NavLink } from 'react-router-dom';
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

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `nav-item${isActive ? ' active' : ''}`;

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sb-section">
        <NavLink to="/" className={navLinkClass}>
          <Search size={13} className="nav-icon" />
          <span>Pesquisar</span>
        </NavLink>
        <NavLink to="/inbox" className={navLinkClass}>
          <Inbox size={13} className="nav-icon" />
          <span>Caixa de entrada</span>
          <span className="nav-badge">8</span>
        </NavLink>
        <NavLink to="/dashboard" className={navLinkClass}>
          <LayoutDashboard size={13} className="nav-icon" />
          <span>Painéis</span>
        </NavLink>
        <NavLink to="/my-tasks" className={navLinkClass}>
          <CheckSquare size={13} className="nav-icon" />
          <span>Minhas tarefas</span>
        </NavLink>
      </div>
      <div className="sb-hr" />
      <div className="sb-section">
        <div className="sb-title">Projetos e pastas</div>
        <NavLink to="/projects/demandas" className={navLinkClass}>
          <FolderOpen size={13} className="nav-icon" />
          <span>1. Demandas</span>
        </NavLink>
        <NavLink to="/projects/aprovacao" className={navLinkClass}>
          <FolderOpen size={13} className="nav-icon" />
          <span>2. Projetos em Aprovação</span>
        </NavLink>
        <NavLink to="/faturamento" className={navLinkClass}>
          <Folder size={13} className="nav-icon" />
          <span>3. Projetos Ativos | Desen…</span>
        </NavLink>
        <NavLink to="/projects/implantados" className={navLinkClass}>
          <FolderOpen size={13} className="nav-icon" />
          <span>4. Projetos Implantados</span>
        </NavLink>
      </div>
      <div className="sb-hr" />
      <div className="sb-section">
        <div className="sb-title">Ferramentas</div>
        <NavLink to="/settings" className={navLinkClass}>
          <Settings size={13} className="nav-icon" />
          <span>Configurações</span>
        </NavLink>
        <NavLink to="/integrations" className={navLinkClass}>
          <Link2 size={13} className="nav-icon" />
          <span>Integrações n8n</span>
        </NavLink>
      </div>
    </nav>
  );
}
