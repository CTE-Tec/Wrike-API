'use client';

import { useState, useEffect } from 'react';
import { fetchProjects, saveBillingProfile } from '../lib/data';
import type { Project } from '../lib/types';
import Layout from '../components/Layout';
import { Save, FileCheck2 } from 'lucide-react';
import { showToast } from '../components/Toast';

export default function CadastroFaturamento() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  // Form fields
  const [clientName, setClientName] = useState('');
  const [measurementDates, setMeasurementDates] = useState('');
  const [billingDates, setBillingDates] = useState('');
  const [docsRequired, setDocsRequired] = useState('');
  const [isNewClient, setIsNewClient] = useState(true);
  const [notes, setNotes] = useState('');

  const loadProjects = () => {
    fetchProjects().then(p => {
      setProjects(p);
      if (p.length > 0) {
        if (!selectedProjectId) {
          setSelectedProjectId(p[0].id);
          loadProjectProfile(p[0]);
        } else {
          const currentProj = p.find(x => x.id === selectedProjectId);
          if (currentProj) loadProjectProfile(currentProj);
        }
      }
    });
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjectProfile = (proj: Project) => {
    if (proj.billing_profile) {
      const bp = proj.billing_profile;
      setClientName(proj.client || '');
      setMeasurementDates(bp.measurementDates);
      setBillingDates(bp.billingDates);
      setDocsRequired(bp.docsRequired);
      setIsNewClient(bp.isNewClient);
      setNotes(bp.notes || '');
    } else {
      setClientName(proj.client || '');
      setMeasurementDates('Dia 20 de cada mês');
      setBillingDates('D+5 após aprovação');
      setDocsRequired('Nota Fiscal, CND, GFIP');
      setIsNewClient(true);
      setNotes('');
    }
  };

  const handleProjectChange = (id: string) => {
    setSelectedProjectId(id);
    const p = projects.find(x => x.id === id);
    if (p) loadProjectProfile(p);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    
    try {
      const p = projects.find(x => x.id === selectedProjectId);
      await saveBillingProfile({
        id: p?.billing_profile?.id,
        projectId: selectedProjectId,
        measurementDates,
        billingDates,
        docsRequired,
        isNewClient,
        notes
      });
      showToast('💾', 'Perfil Salvo com Sucesso', 'Dados de faturamento integrados ao fluxo do projeto.', 'tg');
      loadProjects();
    } catch (error) {
      console.error(error);
      showToast('❌', 'Erro ao Salvar Perfil', 'Ocorreu um problema ao salvar as informações no banco de dados.', 'tr');
    }
  };


  return (
    <Layout breadcrumb={[
      { label: 'Inteligência Artificial | Projetos' },
      { label: 'Cadastros' },
      { label: 'Perfil de Faturamento', active: true }
    ]}>
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-white border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
          <div className="bg-[var(--surface2)] px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
            <FileCheck2 className="text-sky-600" size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text)]">Formulário de Informações de Faturamento</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
            {/* Project Selector */}
            <div>
              <label className="block font-bold text-[var(--muted)] uppercase mb-1">Selecione o Projeto</label>
              <select 
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full bg-[var(--surface2)] border border-[var(--border2)] rounded px-3 py-2 text-[var(--text)] font-semibold outline-none focus:border-sky-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.label_code})</option>
                ))}
              </select>
            </div>

            {/* Client name */}
            <div>
              <label className="block font-bold text-[var(--muted)] uppercase mb-1">Nome do Cliente / Razão Social</label>
              <input 
                type="text" 
                value={clientName} 
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Cyrela Commercial Properties"
                className="w-full bg-[var(--surface2)] border border-[var(--border2)] rounded px-3 py-2 outline-none focus:border-sky-500"
                required
              />
            </div>

            {/* Checkbox New vs Existing */}
            <div className="flex gap-4 p-2 bg-[var(--surface2)] rounded border border-[var(--border2)]">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-[var(--text)]">
                <input 
                  type="radio" 
                  checked={isNewClient}
                  onChange={() => setIsNewClient(true)}
                  className="accent-sky-600"
                />
                Cliente Novo (Preenchimento Completo)
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-[var(--text)]">
                <input 
                  type="radio" 
                  checked={!isNewClient}
                  onChange={() => setIsNewClient(false)}
                  className="accent-sky-600"
                />
                Cliente Existente / Aditivo Contratual
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Measurement day */}
              <div>
                <label className="block font-bold text-[var(--muted)] uppercase mb-1">Datas de Medição (Dia Limite)</label>
                <input 
                  type="text" 
                  value={measurementDates}
                  onChange={(e) => setMeasurementDates(e.target.value)}
                  placeholder="Ex: Dia 20 de cada mês"
                  className="w-full bg-[var(--surface2)] border border-[var(--border2)] rounded px-3 py-2 outline-none focus:border-sky-500"
                  required
                />
              </div>

              {/* Billing days */}
              <div>
                <label className="block font-bold text-[var(--muted)] uppercase mb-1">Datas de Faturamento (Emissão NF)</label>
                <input 
                  type="text" 
                  value={billingDates}
                  onChange={(e) => setBillingDates(e.target.value)}
                  placeholder="Ex: D+5 após aprovação"
                  className="w-full bg-[var(--surface2)] border border-[var(--border2)] rounded px-3 py-2 outline-none focus:border-sky-500"
                  required
                />
              </div>
            </div>

            {/* Documentation Checklist */}
            <div>
              <label className="block font-bold text-[var(--muted)] uppercase mb-1">Documentação Necessária para Faturamento</label>
              <input 
                type="text" 
                value={docsRequired}
                onChange={(e) => setDocsRequired(e.target.value)}
                placeholder="Ex: NF-e, CND, Relatório assinado, ART"
                className="w-full bg-[var(--surface2)] border border-[var(--border2)] rounded px-3 py-2 outline-none focus:border-sky-500"
                required
              />
            </div>

            {/* Custom Notes */}
            <div>
              <label className="block font-bold text-[var(--muted)] uppercase mb-1">Observações Operacionais</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Enviar fatura com cópia para o financeiro corporativo..."
                rows={3}
                className="w-full bg-[var(--surface2)] border border-[var(--border2)] rounded px-3 py-2 outline-none focus:border-sky-500 resize-none"
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded transition flex items-center gap-1.5 shadow-sm"
              >
                <Save size={13} /> Salvar Configuração de Faturamento
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
