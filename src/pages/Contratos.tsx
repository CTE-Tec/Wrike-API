'use client';

import { useState, useEffect } from 'react';
import { fetchProjects, brl } from '../lib/data';
import type { Project } from '../lib/types';
import Layout from '../components/Layout';
import { FileText, Calendar, TrendingUp, Mail, ExternalLink, Clock, Sparkles } from 'lucide-react';
import { showToast } from '../components/Toast';

export default function Contratos() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>('2026-06-15');

  useEffect(() => {
    fetchProjects().then(p => {
      setProjects(p);
      if (p.length > 0) setSelectedProjectId(p[0].id);
    });
  }, []);

  const selectedProj = projects.find(p => p.id === selectedProjectId);

  const handleSendFup = () => {
    if (!selectedProj) return;
    showToast('✉️', 'FUP Enviado', `E-mail de cobrança enviado para ${selectedProj.email || 'cliente'}. Link para upload anexado.`, 'tg');
  };

  const handleRecalculateIA = () => {
    if (!selectedProj || !selectedProj.contract_details) return;
    const details = selectedProj.contract_details;
    const reajuste = Math.round(details.originalValue * 1.042);
    showToast('✨', 'IA Analisou o Contrato', `Ajuste sugerido com base no ${details.index}: novo valor ${brl(reajuste)}.`, 'to');
  };

  return (
    <Layout breadcrumb={[
      { label: 'Inteligência Artificial | Projetos' },
      { label: 'Contratos' },
      { label: 'Gestão de Contratos', active: true }
    ]}>
      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Side: Contracts List */}
        <div className="bg-white border border-[var(--border)] rounded-xl p-4 shadow-sm lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] pb-2 border-b border-[var(--border)]">Contratos Ativos & Aditivos</h2>
          
          <div className="space-y-3">
            {projects.map(p => {
              const details = p.contract_details;
              if (!details) return null;
              return (
                <div 
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition flex items-center justify-between ${
                    selectedProjectId === p.id 
                      ? 'border-sky-500 bg-sky-500/5' 
                      : 'border-[var(--border)] hover:bg-[var(--surface2)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-sky-600" />
                    <div>
                      <div className="text-xs font-bold text-[var(--text)]">{p.name}</div>
                      <div className="text-[10px] text-[var(--muted)]">Código: {p.label_code} | Owner: {p.owner}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-800">{brl(details.readjustedValue)}</div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      details.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {details.status === 'approved' ? 'Aprovado' : 'Aguardando Retorno'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Contract Detail & Actions */}
        {selectedProj && selectedProj.contract_details ? (
          <div className="bg-white border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="pb-2 border-b border-[var(--border)]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Detalhes do Contrato</h3>
                <h4 className="text-sm font-bold text-[var(--text)] mt-1">{selectedProj.name}</h4>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[var(--surface2)] p-2 rounded">
                  <span className="block text-[9px] uppercase font-bold text-[var(--muted)]">Valor Original</span>
                  <span className="font-bold">{brl(selectedProj.contract_details.originalValue)}</span>
                </div>
                <div className="bg-[var(--surface2)] p-2 rounded">
                  <span className="block text-[9px] uppercase font-bold text-[var(--muted)]">Valor Reajustado</span>
                  <span className="font-bold text-teal-700">{brl(selectedProj.contract_details.readjustedValue)}</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[var(--border)]">
                  <span className="text-[var(--text2)] flex items-center gap-1.5"><Calendar size={12} /> Próximo Reajuste</span>
                  <span className="font-bold text-[var(--text)]">{selectedProj.contract_details.renewalDate}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--border)]">
                  <span className="text-[var(--text2)] flex items-center gap-1.5"><TrendingUp size={12} /> Índice Contratual</span>
                  <span className="font-bold text-sky-700">{selectedProj.contract_details.index}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--border)]">
                  <span className="text-[var(--text2)] flex items-center gap-1.5"><Clock size={12} /> Data Esperada de Retorno</span>
                  <input 
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="font-bold bg-[var(--surface2)] border border-[var(--border2)] rounded px-1.5 py-0.5 text-[11px]"
                  />
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[var(--text2)] flex items-center gap-1.5"><FileText size={12} /> Documento na Nuvem</span>
                  <a href={selectedProj.contract_details.documentUrl} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline flex items-center gap-0.5 font-semibold">
                    Link Contrato <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-[var(--border)]">
              <button 
                onClick={handleRecalculateIA}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Sparkles size={13} /> Analisar Reajuste por IA
              </button>
              
              <button 
                onClick={handleSendFup}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 rounded transition flex items-center justify-center gap-1.5"
              >
                <Mail size={13} /> Disparar FUP por E-mail
              </button>
              
              <div className="text-[9px] text-[var(--muted)] text-center mt-1">
                * O e-mail de FUP envia um link seguro para o cliente revisar e anexar o contrato digitalizado assinado.
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[var(--border)] rounded-xl p-8 shadow-sm flex items-center justify-center text-[var(--muted)] text-xs text-center">
            Selecione um projeto para ver os detalhes do contrato.
          </div>
        )}
      </div>
    </Layout>
  );
}
