'use client';

import { useEffect, useState } from 'react';
import { fetchIntegrations } from '../lib/data';
import type { Integration } from '../lib/types';
import Layout from '../components/Layout';
import { Link2, Activity, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  active: { icon: <CheckCircle2 size={14} />, color: '#4fa832', bg: 'rgba(79,168,50,.1)', label: 'Ativo' },
  inactive: { icon: <XCircle size={14} />, color: '#939598', bg: 'rgba(147,149,152,.1)', label: 'Inativo' },
  error: { icon: <AlertTriangle size={14} />, color: '#a81928', bg: 'rgba(168,25,40,.1)', label: 'Erro' },
};

const TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  n8n: { color: '#d44e1a', label: 'n8n Workflow' },
  wrike: { color: '#004d6d', label: 'Wrike API' },
  api: { color: '#007a83', label: 'API Custom' },
};

export default function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  useEffect(() => {
    fetchIntegrations().then(setIntegrations);
  }, []);

  return (
    <Layout
      breadcrumb={[
        { label: 'Inteligência Artificial | Projetos' },
        { label: 'Integrações n8n', active: true },
      ]}
    >
      <div className="max-w-3xl mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[var(--surface3)] flex items-center justify-center text-[var(--cte2)]">
            <Link2 size={18} />
          </div>
          <div>
            <h1 className="text-[16px] font-bold text-[var(--text)]">Integrações n8n</h1>
            <p className="text-[12px] text-[var(--muted)]">Gerencie as integrações e webhooks conectados</p>
          </div>
        </div>

        <div className="space-y-3">
          {integrations.map((integ) => {
            const sc = STATUS_CONFIG[integ.status] || STATUS_CONFIG.inactive;
            const tc = TYPE_CONFIG[integ.type] || TYPE_CONFIG.api;
            return (
              <div key={integ.id} className="bg-white border border-[var(--border)] rounded-lg p-4 hover:border-[var(--border2)] transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${tc.color}14`, color: tc.color }}>
                    <Activity size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[var(--text)]">{integ.name}</div>
                    <div className="text-[11px] text-[var(--muted)]">{tc.label}</div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold" style={{ background: sc.bg, color: sc.color }}>
                    {sc.icon}
                    {sc.label}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-[var(--muted)]">
                  <span>URL: {integ.url || '—'}</span>
                  {integ.last_sync && (
                    <span>Última sinc.: {new Date(integ.last_sync).toLocaleString('pt-BR')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {integrations.length === 0 && (
          <div className="text-center py-14 text-[var(--muted)]">
            <Link2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhuma integração configurada.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
