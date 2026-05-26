'use client';

import Layout from '../components/Layout';
import { UserCircle } from 'lucide-react';

export default function FichaCliente() {
  return (
    <Layout
      breadcrumb={[
        { label: 'Navegação Principal' },
        { label: 'Ficha do Cliente', active: true },
      ]}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--surface3)] flex items-center justify-center text-[var(--cte2)]">
            <UserCircle size={16} />
          </div>
          <div>
            <h1 className="text-[16px] font-bold text-[var(--text)]">Ficha do Cliente</h1>
            <p className="text-[12px] text-[var(--muted)]">Informações de faturamento de cada cliente</p>
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-lg p-14 text-center">
          <UserCircle size={40} className="mx-auto mb-3 text-[var(--border2)]" />
          <h2 className="text-[14px] font-bold text-[var(--text)] mb-1">Módulo em Desenvolvimento</h2>
          <p className="text-[12px] text-[var(--muted)]">O perfil e a ficha detalhada de faturamento do cliente serão carregados aqui.</p>
        </div>
      </div>
    </Layout>
  );
}
