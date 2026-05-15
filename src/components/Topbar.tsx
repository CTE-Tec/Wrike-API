import HexLogo from './HexLogo';
import { RefreshCw, Download } from 'lucide-react';
import { showToast } from './Toast';

interface TopbarProps {
  breadcrumb: { label: string; active?: boolean }[];
}

export default function Topbar({ breadcrumb }: TopbarProps) {
  return (
    <div className="topbar">
      <a className="topbar-logo" href="#">
        <HexLogo />
        <div className="logo-wordmark">
          <span className="lw-brand">cte</span>
          <span className="lw-sub">centro de tecnologia</span>
        </div>
      </a>

      <div className="topbar-crumb">
        {breadcrumb.map((b, i) => (
          <span key={i} className={b.active ? 'cur' : ''}>
            {i > 0 && <span className="sep">{'›'}</span>}
            {b.label}
          </span>
        ))}
      </div>

      <div className="topbar-right">
        <div className="live-dot">
          <span />
          Sincronizado
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => showToast('🔄', 'Atualizando…', 'Buscando dados do Wrike', '')}
        >
          <RefreshCw size={11} />
          Atualizar
        </button>
        <button
          className="btn btn-primary"
          onClick={() => showToast('📤', 'Exportando…', 'Gerando relatório PDF', 'tg')}
        >
          <Download size={11} />
          Exportar
        </button>
      </div>
    </div>
  );
}
