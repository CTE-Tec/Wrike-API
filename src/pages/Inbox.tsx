'use client';

import { useEffect, useState } from 'react';
import { fetchInboxMessages, markMessageRead } from '../lib/data';
import type { InboxMessage } from '../lib/types';
import Layout from '../components/Layout';
import { Bell, AlertTriangle, Info, CheckCircle2, Mail } from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  alert: { icon: <AlertTriangle size={16} />, color: '#a81928', bg: 'rgba(168,25,40,.08)' },
  approval: { icon: <CheckCircle2 size={16} />, color: '#4fa832', bg: 'rgba(79,168,50,.08)' },
  info: { icon: <Info size={16} />, color: '#007a83', bg: 'rgba(0,122,131,.08)' },
  warning: { icon: <Bell size={16} />, color: '#d44e1a', bg: 'rgba(212,78,26,.08)' },
};

export default function Inbox() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchInboxMessages().then(setMessages);
  }, []);

  const handleMarkRead = async (id: string) => {
    await markMessageRead(id);
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, read: true } : m));
  };

  const handleMarkAllRead = async () => {
    const unread = messages.filter((m) => !m.read);
    await Promise.all(unread.map((m) => markMessageRead(m.id)));
    setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
  };

  const filtered = filter === 'unread' ? messages.filter((m) => !m.read) : messages;
  const unreadCount = messages.filter((m) => !m.read).length;

  const toolbar = (
    <div className="vtoolbar">
      <div className="vtabs">
        <div className={`vtab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          <Mail size={11} />
          Todas ({messages.length})
        </div>
        <div className={`vtab ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>
          <Bell size={11} />
          Não lidas ({unreadCount})
        </div>
      </div>
      <div className="vright">
        {unreadCount > 0 && (
          <button className="btn btn-ghost" onClick={handleMarkAllRead}>
            Marcar todas como lidas
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Layout
      breadcrumb={[
        { label: 'Inteligência Artificial | Projetos' },
        { label: 'Caixa de entrada', active: true },
      ]}
      toolbar={toolbar}
    >
      <div className="max-w-3xl mx-auto py-4 px-3.5">
        {filtered.length === 0 && (
          <div className="text-center py-14 text-[var(--muted)]">
            <Mail size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhuma mensagem {filter === 'unread' ? 'não lida' : ''}.</p>
          </div>
        )}
        {filtered.map((m) => {
          const cfg = TYPE_CONFIG[m.type] || TYPE_CONFIG.info;
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 p-3.5 mb-2 rounded-lg border transition-all cursor-pointer ${
                m.read
                  ? 'bg-white border-[var(--border)] opacity-70'
                  : 'bg-white border-[var(--border2)] shadow-sm'
              }`}
              onClick={() => { if (!m.read) handleMarkRead(m.id); }}
            >
              <div
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[13px] font-semibold ${m.read ? 'text-[var(--text2)]' : 'text-[var(--text)]'}`}>
                    {m.title}
                  </span>
                  {!m.read && <span className="w-2 h-2 rounded-full bg-[var(--enredes)] shrink-0" />}
                </div>
                <p className="text-[12px] text-[var(--text2)] mt-0.5">{m.body}</p>
                <span className="text-[10px] text-[var(--muted)] mt-1 block">
                  {new Date(m.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
