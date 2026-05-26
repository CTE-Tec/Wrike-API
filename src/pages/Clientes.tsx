'use client';

import Layout from '../components/Layout';
import { Users } from 'lucide-react';

export default function Clientes() {
  return (
    <Layout
      breadcrumb={[
        { label: 'Navegação Principal' },
        { label: 'Clientes', active: true },
      ]}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--surface3)] flex items-center justify-center text-[var(--cte2)]">
            <Users size={16} />
          </div>
          <div>
            <h1 className="text-[16px] font-bold text-[var(--text)]">Clientes</h1>
            <p className="text-[12px] text-[var(--muted)]">Lista de todos os clientes</p>
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-lg p-14 text-center">
          <Users size={40} className="mx-auto mb-3 text-[var(--border2)]" />
          <h2 className="text-[14px] font-bold text-[var(--text)] mb-1">Módulo em Desenvolvimento</h2>
          <p className="text-[12px] text-[var(--muted)]">A lista de clientes será carregada aqui em breve.</p>
        </div>
      </div>
    </Layout>
  );
}
