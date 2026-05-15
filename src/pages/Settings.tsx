import Layout from '../components/Layout';
import { Settings as SettingsIcon, User, Bell, Shield, Palette } from 'lucide-react';

export default function Settings() {
  return (
    <Layout
      breadcrumb={[
        { label: 'Inteligência Artificial | Projetos' },
        { label: 'Configurações', active: true },
      ]}
    >
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[var(--surface3)] flex items-center justify-center text-[var(--cte2)]">
            <SettingsIcon size={18} />
          </div>
          <div>
            <h1 className="text-[16px] font-bold text-[var(--text)]">Configurações</h1>
            <p className="text-[12px] text-[var(--muted)]">Gerencie as configurações do sistema</p>
          </div>
        </div>

        <div className="space-y-3">
          <SettingCard icon={<User size={16} />} title="Perfil" desc="Informações pessoais e preferências de conta" color="var(--cte2)" />
          <SettingCard icon={<Bell size={16} />} title="Notificações" desc="Configurar alertas por e-mail e push" color="var(--enredes)" />
          <SettingCard icon={<Shield size={16} />} title="Segurança" desc="Autenticação em dois fatores e sessões ativas" color="var(--sustenta)" />
          <SettingCard icon={<Palette size={16} />} title="Aparência" desc="Tema claro/escuro e personalização visual" color="var(--gerencia)" />
        </div>
      </div>
    </Layout>
  );
}

function SettingCard({ icon, title, desc, color }: { icon: React.ReactNode; title: string; desc: string; color: string }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-4 flex items-center gap-3 hover:border-[var(--border2)] transition-colors cursor-pointer">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}14`, color }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-[var(--text)]">{title}</div>
        <div className="text-[11px] text-[var(--muted)]">{desc}</div>
      </div>
      <span className="text-[var(--muted)] text-[13px]">›</span>
    </div>
  );
}
