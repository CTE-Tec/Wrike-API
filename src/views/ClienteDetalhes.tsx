'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchClienteById, fetchFaturamentoPerfilByClienteId, fetchProjects } from '../lib/data';
import { showToast } from '../components/Toast';
import type { Cliente, ContatoItem, FaturamentoPerfil, Project } from '../lib/types';
import Layout from '../components/Layout';
import { ArrowLeft, Loader, Phone, Mail, Building2, User, FileText, AlertCircle, Clock, DollarSign } from 'lucide-react';

function formatCNPJ(cnpj: string): string {
  if (!cnpj) return '—';
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function formatPhone(phone: string | null): string {
  if (!phone) return '—';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  return clean.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
}

function parseJSONB(value: ContatoItem[] | string | null | undefined): ContatoItem[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return typeof value === 'string' ? JSON.parse(value) : [];
  } catch {
    return [];
  }
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
          showToast('AlertCircle', 'Erro', 'ID do cliente não encontrado');
          return;
        }

        const clienteData = await fetchClienteById(clienteId);
        if (!clienteData) {
          showToast('AlertCircle', 'Erro', 'Cliente não encontrado');
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
        showToast('AlertCircle', 'Erro', 'Erro ao carregar detalhes do cliente');
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

  const getMedicaoContacts = () => {
    if (!cliente) return [];
    const parsed = parseJSONB(cliente.contatos_medicao);
    if (parsed.length > 0) return parsed;
    if (cliente.contato_tecnico_nome) {
      return [{
        nome: cliente.contato_tecnico_nome,
        email: cliente.contato_tecnico_email || '',
        telefone: cliente.contato_tecnico_telefone || ''
      }];
    }
    return [];
  };

  const getCobrancaContacts = () => {
    if (!cliente) return [];
    const parsed = parseJSONB(cliente.contatos_cobranca);
    if (parsed.length > 0) return parsed;
    if (cliente.contato_cobranca_nome) {
      return [{
        nome: cliente.contato_cobranca_nome,
        email: cliente.contato_cobranca_email || '',
        telefone: cliente.contato_cobranca_telefone || ''
      }];
    }
    return [];
  };

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

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'start' }}>
          {/* Main/Left Column - 3/4 width */}
          <div style={{ flex: '3 1 600px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Informações de Faturamento */}
            <Section title="Informações de Faturamento" icon={<Building2 size={20} />}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <InfoRow label="Razão Social" value={cliente.razao_social} />
                  <InfoRow label="Nome Fantasia" value={cliente.nome_fantasia || '—'} />
                  <InfoRow label="CNPJ" value={formatCNPJ(cliente.cnpj)} />
                  <InfoRow 
                    label="Inscrição Estadual" 
                    value={
                      cliente.isento_inscricao_estadual ? (
                        <div>
                          <span style={{ color: '#d44e1a', fontWeight: 600, fontSize: '12px', background: '#fdf2e9', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fbd9b9' }}>Isenta</span>
                          {cliente.observacao_inscricao_estadual && (
                            <p style={{ fontSize: '11px', color: '#8099ae', margin: '4px 0 0 0', fontWeight: 'normal', lineHeight: '1.4' }}>
                              Motivo: {cliente.observacao_inscricao_estadual}
                            </p>
                          )}
                        </div>
                      ) : (
                        cliente.inscricao_estadual || '—'
                      )
                    } 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <InfoRow label="CEP" value={cliente.cep || '—'} />
                  <InfoRow label="Logradouro" value={cliente.logradouro || '—'} />
                  <InfoRow label="Número" value={cliente.numero || '—'} />
                  {cliente.complemento && <InfoRow label="Complemento" value={cliente.complemento} />}
                  <InfoRow label="Bairro" value={cliente.bairro || '—'} />
                  <InfoRow label="Cidade/UF" value={cliente.cidade && cliente.estado ? `${cliente.cidade}/${cliente.estado}` : '—'} />
                </div>
              </div>
            </Section>

            {/* Contatos Responsáveis */}
            <Section title="Contatos Responsáveis" icon={<User size={20} />}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {/* Contatos para Medição */}
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#4a6478', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid #edf0f4', paddingBottom: '4px' }}>
                    Contatos para Medição
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {getMedicaoContacts().length === 0 ? (
                      <span style={{ fontSize: '12px', color: '#8099ae', fontStyle: 'italic' }}>Nenhum contato cadastrado</span>
                    ) : (
                      getMedicaoContacts().map((c: ContatoItem, idx: number) => (
                        <div key={idx} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #edf0f4', background: '#f8fafc' }}>
                          <div style={{ fontWeight: 600, color: '#1a2e3b', fontSize: '12px', marginBottom: '4px' }}>{c.nome}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', color: '#4a6478' }}>
                            {c.email && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Mail size={12} style={{ color: '#8099ae' }} />
                                <span>{c.email}</span>
                              </div>
                            )}
                            {c.telefone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Phone size={12} style={{ color: '#8099ae' }} />
                                <span>{formatPhone(c.telefone)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Contatos para Cobrança */}
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#4a6478', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid #edf0f4', paddingBottom: '4px' }}>
                    Contatos para Cobrança (Envio de NF)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {getCobrancaContacts().length === 0 ? (
                      <span style={{ fontSize: '12px', color: '#8099ae', fontStyle: 'italic' }}>Nenhum contato cadastrado</span>
                    ) : (
                      getCobrancaContacts().map((c: ContatoItem, idx: number) => (
                        <div key={idx} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #edf0f4', background: '#f8fafc' }}>
                          <div style={{ fontWeight: 600, color: '#1a2e3b', fontSize: '12px', marginBottom: '4px' }}>{c.nome}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', color: '#4a6478' }}>
                            {c.email && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Mail size={12} style={{ color: '#8099ae' }} />
                                <span>{c.email}</span>
                              </div>
                            )}
                            {c.telefone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Phone size={12} style={{ color: '#8099ae' }} />
                                <span>{formatPhone(c.telefone)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Section>

            {/* Configurações de Faturamento */}
            {faturamentoPerfil && (
              <Section title="Configurações de Faturamento" icon={<DollarSign size={20} />}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <InfoRow
                      label="Prazo de Vencimento"
                      value={faturamentoPerfil.prazo_vencimento_dias !== null ? `${faturamentoPerfil.prazo_vencimento_dias} dias` : '—'}
                    />
                    <InfoRow
                      label="Forma de Pagamento"
                      value={
                        faturamentoPerfil.forma_pagamento === 'transferencia' ? (
                          <span style={{ color: '#007a83', background: '#e0f2f1', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, border: '1px solid #b2dfdb' }}>
                            Transferência Bancária (TED/PIX)
                          </span>
                        ) : faturamentoPerfil.forma_pagamento === 'boleto' ? (
                          <span style={{ color: '#1565c0', background: '#e3f2fd', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, border: '1px solid #bbdefb' }}>
                            Boleto Bancário
                          </span>
                        ) : '—'
                      }
                    />
                    <InfoRow
                      label="Período de Recebimento de Medições"
                      value={
                        !faturamentoPerfil.janela_medicao_inicio || (faturamentoPerfil.janela_medicao_inicio === 1 && faturamentoPerfil.janela_medicao_fim === 30) ? (
                          <div style={{ fontSize: '12px', color: '#1e4620', background: '#edf7ed', padding: '6px 10px', borderRadius: '6px', border: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                            <Clock size={14} style={{ color: '#2e7d32' }} />
                            <span>Padrão do CTE (Livre ao longo do mês)</span>
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: '#1a2e3b', fontWeight: 500 }}>
                            Dia {faturamentoPerfil.janela_medicao_inicio} a Dia {faturamentoPerfil.janela_medicao_fim} do mês
                          </div>
                        )
                      }
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <InfoRow label="Condições de Pagamento (Obs.)" value={faturamentoPerfil.condicoes_pagamento_obs || '—'} />
                    <InfoRow label="Informações Adicionais na NF" value={faturamentoPerfil.faturamento_obs_nf || '—'} />
                  </div>
                </div>
              </Section>
            )}

            {/* Contrato & Documentação */}
            {faturamentoPerfil && (
              <Section title="Contrato & Documentos" icon={<FileText size={20} />}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <InfoRow 
                    label="Elaborar Contrato de Prestação de Serviços?" 
                    value={
                      faturamentoPerfil.elaborar_contrato === true 
                        ? 'Sim' 
                        : faturamentoPerfil.elaborar_contrato === false 
                          ? 'Não, seguiremos com a proposta comercial' 
                          : '—'
                    } 
                  />
                  
                  {faturamentoPerfil.elaborar_contrato === true && (
                    <div style={{ marginTop: '4px' }}>
                      <p style={{ fontSize: '12px', color: '#8099ae', margin: '0 0 6px 0' }}>Documentos cadastrais / jurídicos solicitados</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {!faturamentoPerfil.documentacao_necessaria || faturamentoPerfil.documentacao_necessaria.length === 0 ? (
                          <span style={{ fontSize: '12px', color: '#8099ae', fontStyle: 'italic' }}>Nenhum documento solicitado</span>
                        ) : (
                          faturamentoPerfil.documentacao_necessaria.map((doc, idx) => (
                            <span key={idx} style={{ 
                              background: '#f1f5f9', 
                              color: '#334155', 
                              padding: '4px 10px', 
                              borderRadius: '16px', 
                              fontSize: '11px', 
                              fontWeight: 500,
                              border: '1px solid #cbd5e1'
                            }}>
                              {doc}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}
          </div>

          {/* Sidebar Column - 1/4 width */}
          <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Status do Formulário */}
            {faturamentoPerfil && (
              <Section title="Status do Formulário">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                  {(() => {
                    const status = faturamentoPerfil.status_formulario || 'pendente';
                    let label = 'Pendente';
                    let bg = '#fff8e1';
                    let text = '#b78103';
                    let border = '#ffe082';
                    
                    if (status === 'respondido') {
                      label = 'Respondido';
                      bg = '#e8f5e9';
                      text = '#2e7d32';
                      border = '#c8e6c9';
                    } else if (status === 'enviado') {
                      label = 'Enviado';
                      bg = '#e3f2fd';
                      text = '#1565c0';
                      border = '#bbdefb';
                    }
                    
                    return (
                      <span style={{
                        display: 'inline-block',
                        background: bg,
                        color: text,
                        border: `1px solid ${border}`,
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 600,
                        textAlign: 'center',
                        width: '100%',
                      }}>
                        {label}
                      </span>
                    );
                  })()}
                  <span style={{ fontSize: '11px', color: '#8099ae', textAlign: 'center' }}>
                    Última atualização: {formatDate(faturamentoPerfil.updated_at || faturamentoPerfil.created_at)}
                  </span>
                </div>
              </Section>
            )}

            {/* Ponto Focal (Preenchedor) */}
            {(cliente.preenchedor_nome || cliente.preenchedor_email) && (
              <Section title="Ponto Focal" icon={<User size={18} />}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <InfoRow label="Nome" value={cliente.preenchedor_nome || '—'} />
                  <InfoRow label="Email" value={cliente.preenchedor_email || '—'} icon={<Mail size={14} />} />
                </div>
              </Section>
            )}

            {/* Projeto Vinculado */}
            {projeto && (
              <Section title="Projeto Vinculado">
                <button
                  onClick={() => router.push(`/faturamento?projectId=${projeto.id}`)}
                  style={{ 
                    background: '#004d6d', 
                    border: 'none', 
                    borderRadius: '6px',
                    color: '#fff', 
                    fontWeight: 600, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '8px', 
                    fontSize: '12px', 
                    transition: 'background .11s', 
                    padding: '8px 12px', 
                    margin: 0,
                    width: '100%',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#005f88'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#004d6d'}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{projeto.name}</span>
                  <ArrowLeft size={12} style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
                </button>
              </Section>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
