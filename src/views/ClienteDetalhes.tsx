'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchClienteById, fetchFaturamentoPerfilByClienteId, fetchProjects } from '../lib/data';
import { showToast } from '../components/Toast';
import type { Cliente, FaturamentoPerfil, Project } from '../lib/types';
import Layout from '../components/Layout';
import { ArrowLeft, Loader, MapPin, Phone, Mail, Building2, User, FileText, AlertCircle } from 'lucide-react';

function formatCNPJ(cnpj: string): string {
  if (!cnpj) return '—';
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function formatPhone(phone: string | null): string {
  if (!phone) return '—';
  return phone.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
}

function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('pt-BR');
}

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function Section({ title, icon, children, className = '' }: SectionProps) {
  return (
    <div style={{ background: '#ffffff', borderRadius: '5px', border: '1px solid #dde3ea', padding: '16px', marginBottom: '12px', ...{ className } }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #edf0f4' }}>
        {icon && <div style={{ color: '#004d6d', fontSize: '18px' }}>{icon}</div>}
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#1a2e3b', textTransform: 'uppercase', letterSpacing: '.05em', margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ReactNode;
}

function InfoRow({ label, value, icon }: InfoRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingTop: '8px', paddingBottom: '8px' }}>
      {icon && <div style={{ color: '#8099ae', marginTop: '2px', flexShrink: 0 }}>{icon}</div>}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '12px', color: '#8099ae', margin: '0 0 4px 0' }}>{label}</p>
        <p style={{ color: '#1a2e3b', fontWeight: 500, margin: 0 }}>{value}</p>
      </div>
    </div>
  );
}

export default function ClienteDetalhes() {
  const router = useRouter();
  const params = useParams();
  const clienteId = params?.id as string;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [faturamentoPerfil, setFaturamentoPerfil] = useState<FaturamentoPerfil | null>(null);
  const [projeto, setProjeto] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadClienteDetails() {
      try {
        setIsLoading(true);

        if (!clienteId) {
          showToast('ID do cliente não encontrado', 'error');
          return;
        }

        const clienteData = await fetchClienteById(clienteId);
        if (!clienteData) {
          showToast('Cliente não encontrado', 'error');
          router.push('/clientes');
          return;
        }

        setCliente(clienteData);

        // Fetch faturamento perfil
        const faturamentoData = await fetchFaturamentoPerfilByClienteId(clienteId);
        if (faturamentoData) {
          setFaturamentoPerfil(faturamentoData);
        }

        // Fetch projeto se existir
        if (clienteData.projeto_id) {
          const projetos = await fetchProjects();
          const projCliente = projetos.find(p => p.id === clienteData.projeto_id);
          if (projCliente) {
            setProjeto(projCliente);
          }
        }
      } catch (error) {
        console.error('Error loading cliente details:', error);
        showToast('Erro ao carregar detalhes do cliente', 'error');
      } finally {
        setIsLoading(false);
      }
    }

    loadClienteDetails();
  }, [clienteId, router]);

  if (isLoading) {
    return (
      <Layout breadcrumb={[{ label: 'Clientes' }, { label: 'Carregando...', active: true }]}>
        <div style={{ flex: 1, overflow: 'auto', background: '#f0f3f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#4a6478' }}>Carregando detalhes do cliente...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!cliente) {
    return (
      <Layout breadcrumb={[{ label: 'Clientes' }, { label: 'Não encontrado', active: true }]}>
        <div style={{ flex: 1, overflow: 'auto', background: '#f0f3f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 16px', color: '#d44e1a' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1a2e3b', marginBottom: '8px' }}>Cliente não encontrado</h2>
            <button onClick={() => router.push('/clientes')} style={{ padding: '6px 16px', background: '#004d6d', border: 'none', borderRadius: '5px', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'background .11s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#005f88'} onMouseLeave={(e) => e.currentTarget.style.background = '#004d6d'}>
              Voltar para clientes
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout breadcrumb={[{ label: 'Clientes' }, { label: cliente.razao_social, active: true }]}>
      <div style={{ flex: 1, overflow: 'auto', background: '#f0f3f6', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <button
            onClick={() => router.push('/clientes')}
            style={{ padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#4a6478', transition: 'color .11s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#004d6d'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#4a6478'}
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#1a2e3b', margin: '0 0 2px 0' }}>{cliente.razao_social}</h1>
            <p style={{ fontSize: '12px', color: '#8099ae', margin: 0 }}>{formatCNPJ(cliente.cnpj)}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          {/* Informações Básicas */}
          <Section title="Informações Básicas" icon={<Building2 size={20} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <InfoRow label="Razão Social" value={cliente.razao_social} />
              <InfoRow label="Nome Fantasia" value={cliente.nome_fantasia || '—'} />
              <InfoRow label="CNPJ" value={formatCNPJ(cliente.cnpj)} />
              <InfoRow label="Inscrição Estadual" value={cliente.inscricao_estadual || '—'} />
              {cliente.nome_empreendimento && (
                <InfoRow label="Empreendimento" value={cliente.nome_empreendimento} />
              )}
            </div>
          </Section>

          {/* Endereço */}
          <Section title="Endereço" icon={<MapPin size={20} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <InfoRow label="CEP" value={cliente.cep || '—'} />
              <InfoRow label="Logradouro" value={cliente.logradouro || '—'} />
              {cliente.numero && <InfoRow label="Número" value={cliente.numero} />}
              {cliente.complemento && <InfoRow label="Complemento" value={cliente.complemento} />}
              {cliente.bairro && <InfoRow label="Bairro" value={cliente.bairro} />}
              {cliente.cidade && cliente.estado && (
                <InfoRow label="Cidade/UF" value={`${cliente.cidade}/${cliente.estado}`} />
              )}
            </div>
          </Section>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          {/* Contato Técnico */}
          <Section title="Contato Técnico" icon={<User size={20} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <InfoRow label="Nome" value={cliente.contato_tecnico_nome || '—'} />
              <InfoRow label="Cargo" value={cliente.contato_tecnico_cargo || '—'} />
              <InfoRow label="Telefone" value={formatPhone(cliente.contato_tecnico_telefone)} icon={<Phone size={16} />} />
              <InfoRow label="Email" value={cliente.contato_tecnico_email || '—'} icon={<Mail size={16} />} />
            </div>
          </Section>

          {/* Contato Cobrança */}
          <Section title="Contato de Cobrança" icon={<User size={20} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <InfoRow label="Nome" value={cliente.contato_cobranca_nome || '—'} />
              <InfoRow label="Telefone" value={formatPhone(cliente.contato_cobranca_telefone)} icon={<Phone size={16} />} />
              <InfoRow label="Email" value={cliente.contato_cobranca_email || '—'} icon={<Mail size={16} />} />
            </div>
          </Section>
        </div>

        {/* Preenchedor */}
        {(cliente.preenchedor_nome || cliente.preenchedor_email) && (
          <Section title="Informações de Preenchimento">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <InfoRow label="Nome" value={cliente.preenchedor_nome || '—'} />
              <InfoRow label="Email" value={cliente.preenchedor_email || '—'} icon={<Mail size={16} />} />
            </div>
          </Section>
        )}

        {/* Projeto Vinculado */}
        {projeto && (
          <Section title="Projeto Vinculado">
            <button
              onClick={() => router.push(`/faturamento?projectId=${projeto.id}`)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#004d6d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', transition: 'color .11s', padding: 0, margin: 0 }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#005f88'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#004d6d'}
            >
              <span>{projeto.name}</span>
              <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </Section>
        )}

        {/* Perfil de Faturamento */}
        {faturamentoPerfil && (
          <>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2e3b', marginTop: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              <FileText size={16} style={{ color: '#004d6d' }} />
              Perfil de Faturamento
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              {/* Configurações Gerais */}
              <Section title="Configurações Gerais">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <InfoRow
                    label="Prazo de Vencimento"
                    value={faturamentoPerfil.prazo_vencimento_dias ? `${faturamentoPerfil.prazo_vencimento_dias} dias` : '—'}
                  />
                  <InfoRow
                    label="Janela de Medição"
                    value={
                      faturamentoPerfil.janela_medicao_inicio && faturamentoPerfil.janela_medicao_fim
                        ? `${faturamentoPerfil.janela_medicao_inicio} a ${faturamentoPerfil.janela_medicao_fim}`
                        : '—'
                    }
                  />
                  <InfoRow
                    label="Período de Medição"
                    value={
                      faturamentoPerfil.periodo_medicao_inicio && faturamentoPerfil.periodo_medicao_fim
                        ? `${faturamentoPerfil.periodo_medicao_inicio} a ${faturamentoPerfil.periodo_medicao_fim}`
                        : '—'
                    }
                  />
                  <InfoRow
                    label="Possui PO"
                    value={faturamentoPerfil.has_purchase_order ? 'Sim' : 'Não'}
                  />
                  <InfoRow
                    label="Elaborar Contrato"
                    value={faturamentoPerfil.elaborar_contrato ? 'Sim' : 'Não'}
                  />
                </div>
              </Section>

              {/* Endereço de Cobrança */}
              <Section title="Endereço de Cobrança">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <InfoRow
                    label="Mesmo do Cliente"
                    value={faturamentoPerfil.cobranca_mesmo_endereco ? 'Sim' : 'Não'}
                  />
                  {!faturamentoPerfil.cobranca_mesmo_endereco && (
                    <>
                      <InfoRow
                        label="Endereço Completo"
                        value={faturamentoPerfil.cobranca_endereco_completo || '—'}
                      />
                      <InfoRow label="CEP" value={faturamentoPerfil.cobranca_cep || '—'} />
                      <InfoRow label="Cidade/UF" value={faturamentoPerfil.cobranca_cidade_uf || '—'} />
                      <InfoRow label="Observações" value={faturamentoPerfil.cobranca_observacoes || '—'} />
                    </>
                  )}
                </div>
              </Section>
            </div>

            {/* Dados de Faturamento */}
            {!faturamentoPerfil.faturamento_mesmos_dados && (
              <Section title="Dados para Faturamento">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <InfoRow label="Razão Social" value={faturamentoPerfil.faturamento_razao_social || '—'} />
                    <InfoRow label="CNPJ" value={formatCNPJ(faturamentoPerfil.faturamento_cnpj || '')} />
                    <InfoRow label="Inscrição Estadual" value={faturamentoPerfil.faturamento_inscricao_estadual || '—'} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <InfoRow label="Endereço" value={faturamentoPerfil.faturamento_endereco || '—'} />
                    <InfoRow label="CEP" value={faturamentoPerfil.faturamento_cep || '—'} />
                    <InfoRow label="Cidade/UF" value={faturamentoPerfil.faturamento_cidade_uf || '—'} />
                    <InfoRow label="Obs. NF" value={faturamentoPerfil.faturamento_obs_nf || '—'} />
                  </div>
                </div>
              </Section>
            )}

            {/* Dados de ART */}
            {faturamentoPerfil.necessita_art && (
              <Section title="Dados para ART">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <InfoRow
                      label="Mesmos Dados de Faturamento"
                      value={faturamentoPerfil.art_mesmos_dados ? 'Sim' : 'Não'}
                    />
                    {!faturamentoPerfil.art_mesmos_dados && (
                      <>
                        <InfoRow label="Razão Social" value={faturamentoPerfil.art_razao_social || '—'} />
                        <InfoRow label="CNPJ" value={formatCNPJ(faturamentoPerfil.art_cnpj || '')} />
                        <InfoRow label="Endereço" value={faturamentoPerfil.art_endereco || '—'} />
                        <InfoRow label="CEP" value={faturamentoPerfil.art_cep || '—'} />
                        <InfoRow label="Cidade/UF" value={faturamentoPerfil.art_cidade_uf || '—'} />
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <InfoRow label="Endereço da Obra" value={faturamentoPerfil.art_endereco_obra || '—'} />
                    <InfoRow label="CEP da Obra" value={faturamentoPerfil.art_cep_obra || '—'} />
                    <InfoRow label="Cidade/Estado da Obra" value={faturamentoPerfil.art_cidade_estado_obra || '—'} />
                    <InfoRow label="Área Construída" value={faturamentoPerfil.art_area_construida ? `${faturamentoPerfil.art_area_construida} m²` : '—'} />
                    <InfoRow label="Finalidade da Obra" value={faturamentoPerfil.art_finalidade_obra || '—'} />
                  </div>
                </div>
              </Section>
            )}

            {/* Datas de Obra */}
            {(faturamentoPerfil.data_inicio_obra || faturamentoPerfil.data_fim_obra) && (
              <Section title="Datas da Obra">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <InfoRow label="Início" value={formatDate(faturamentoPerfil.data_inicio_obra)} />
                  <InfoRow label="Fim" value={formatDate(faturamentoPerfil.data_fim_obra)} />
                </div>
              </Section>
            )}
          </>
        )}

        {cliente.observacao_geral && (
          <Section title="Observações Gerais">
            <p style={{ color: '#1a2e3b', margin: 0, whiteSpace: 'pre-wrap' }}>{cliente.observacao_geral}</p>
          </Section>
        )}
      </div>
    </Layout>
  );
}
