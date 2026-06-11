'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileSpreadsheet, LogOut } from 'lucide-react';
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
        <div className="sb-title">Planilha Financeira</div>
        <Link href="/faturamento" className={navLinkClass('/faturamento', pathname)}>
          <FileSpreadsheet size={13} className="nav-icon text-emerald-500" />
          <span className="font-semibold text-emerald-400">Início</span>
        </Link>
      </div>

      <div className="sb-hr" />

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
