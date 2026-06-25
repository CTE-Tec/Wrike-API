'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchClientes, brl } from '../lib/data';
import { showToast } from '../components/Toast';
import type { Cliente } from '../lib/types';
import Layout from '../components/Layout';
import { Search, Eye, Loader } from 'lucide-react';

function formatCNPJ(cnpj: string): string {
  if (!cnpj) return '—';
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function formatPhone(phone: string | null): string {
  if (!phone) return '—';
  return phone.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
}

function formatAddress(cliente: Cliente): string {
  const parts = [cliente.logradouro, cliente.numero, cliente.complemento, cliente.bairro, cliente.cidade, cliente.estado]
    .filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '—';
}

export default function Clientes() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const loadClientes = useCallback(async (page: number, size: number, search: string) => {
    try {
      setIsLoading(true);
      const result = await fetchClientes(page, size, search || undefined);
      setClientes(result.data);
      setTotalClientes(result.total);
    } catch (error) {
      console.error('Error loading clientes:', error);
      showToast('Erro ao carregar clientes', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClientes(currentPage, pageSize, searchQuery);
  }, [currentPage, pageSize, loadClientes]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      loadClientes(1, pageSize, value);
    }, 500);

    setSearchTimeout(timeout);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleViewDetalhes = (clienteId: string) => {
    router.push(`/clientes/${clienteId}`);
  };

  const totalPages = Math.ceil(totalClientes / pageSize);

  return (
    <Layout breadcrumb={[{ label: 'Clientes', active: true }]}>
      <div className="main-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 14px', height: '40px', background: '#fff', borderBottom: '1px solid #dde3ea', flexShrink: 0 }}>
          <div style={{ fontSize: '13px', color: '#4a6478', fontWeight: 500 }}>Clientes</div>
          <div style={{ marginLeft: 'auto' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '10px', color: '#8099ae' }}><Search size={14} /></span>
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ 
                  background: '#f5f7fa',
                  border: '1px solid #dde3ea',
                  borderRadius: '5px',
                  padding: '4px 10px 4px 28px',
                  color: '#1a2e3b',
                  fontFamily: 'Yantramanav, sans-serif',
                  fontSize: '12px',
                  width: '220px',
                  outline: 'none',
                  transition: 'border-color .13s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#004d6d'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#dde3ea'}
              />
            </div>
          </div>
        </div>


        <div style={{ flex: 1, overflow: 'auto', background: '#f0f3f6' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '12px', color: '#4a6478' }}>
              <Loader size={24} className="animate-spin" />
              <p>Carregando clientes...</p>
            </div>
          ) : clientes.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#8099ae' }}>
              <p>Nenhum cliente encontrado</p>
              {searchQuery && <p style={{ fontSize: '13px', marginTop: '8px' }}>Tente alterar os termos de busca</p>}
            </div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #dde3ea', background: '#f5f7fa' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#4a6478', textTransform: 'uppercase', letterSpacing: '.05em' }}>Razão Social</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#4a6478', textTransform: 'uppercase', letterSpacing: '.05em' }}>Nome Fantasia</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#4a6478', textTransform: 'uppercase', letterSpacing: '.05em' }}>CNPJ</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#4a6478', textTransform: 'uppercase', letterSpacing: '.05em' }}>Cidade/UF</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#4a6478', textTransform: 'uppercase', letterSpacing: '.05em' }}>Contato Técnico</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#4a6478', textTransform: 'uppercase', letterSpacing: '.05em' }}>Telefone</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#4a6478', textTransform: 'uppercase', letterSpacing: '.05em' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cliente) => (
                    <tr key={cliente.id} style={{ borderBottom: '1px solid #edf0f4', transition: 'background-color .11s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f5f7fa'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px', color: '#1a2e3b', fontWeight: 500 }}>{cliente.razao_social}</td>
                      <td style={{ padding: '12px 16px', color: '#4a6478' }}>{cliente.nome_fantasia || '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#4a6478', fontFamily: 'monospace', fontSize: '12px' }}>{formatCNPJ(cliente.cnpj)}</td>
                      <td style={{ padding: '12px 16px', color: '#4a6478' }}>
                        {cliente.cidade && cliente.estado ? `${cliente.cidade}/${cliente.estado}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#4a6478', fontSize: '13px' }}>
                        {cliente.contato_tecnico_nome || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#4a6478', fontFamily: 'monospace', fontSize: '12px' }}>
                        {formatPhone(cliente.contato_cobranca_telefone)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleViewDetalhes(cliente.id)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4a6478', transition: 'color .11s' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#004d6d'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#4a6478'}
                          title="Ver detalhes"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #edf0f4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#4a6478' }}>
                <div>Mostrando {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalClientes)} de {totalClientes} clientes</div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1} style={{ padding: '4px 11px', background: currentPage <= 1 ? '#edf0f4' : '#fff', border: '1px solid #dde3ea', borderRadius: '5px', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', color: '#4a6478', fontSize: '12px', fontWeight: 500, transition: 'all .11s' }} onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = '#f5f7fa')} onMouseLeave={(e) => e.currentTarget.style.background = currentPage <= 1 ? '#edf0f4' : '#fff'}>Anterior</button>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages} style={{ padding: '4px 11px', background: currentPage >= totalPages ? '#edf0f4' : '#fff', border: '1px solid #dde3ea', borderRadius: '5px', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: '#4a6478', fontSize: '12px', fontWeight: 500, transition: 'all .11s' }} onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = '#f5f7fa')} onMouseLeave={(e) => e.currentTarget.style.background = currentPage >= totalPages ? '#edf0f4' : '#fff'}>Próxima</button>
                  <select value={pageSize} onChange={(e) => handlePageSizeChange(Number(e.currentTarget.value))} style={{ padding: '4px 8px', background: '#fff', border: '1px solid #dde3ea', borderRadius: '5px', cursor: 'pointer', color: '#4a6478', fontSize: '12px', fontWeight: 500 }}>
                    {[10, 25, 50, 100].map((size) => (
                      <option key={size} value={size}>{size} / página</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
