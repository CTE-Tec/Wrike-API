export type TaskStatus = 'fat' | 'vis' | 'agu' | 'apr';

export interface BillingProfile {
  id: string;
  projectId: string;
  measurementDates: string;
  billingDates: string;
  docsRequired: string;
  isNewClient: boolean;
  notes?: string;
}

export interface ContractDetails {
  id: string;
  projectId: string;
  documentUrl: string;
  renewalDate: string;
  index: 'INCC-M' | 'IPC' | 'IGP-M';
  expectedReturnDate: string;
  lastFupDate: string;
  status: 'pending_client' | 'approved' | 'review_required';
  originalValue: number;
  readjustedValue: number;
  reajustePct: number;
}

export interface ReajusteHistory {
  id: string;
  project_id: string;
  index_name: string;
  percentage: number;
  original_value: number;
  reajuste_value: number;
  readjusted_value: number;
  notes?: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  responsible: string;
  email: string;
  contracted_value: number;
  tasks_total: number;
  folder: string;
  client?: string;
  area?: string;
  created_at: string;
  owner: string;
  label_code: string;
  flow_date: string;
  contract_original_value: number;
  contract_aditivo_value: number;
  navis_launched_value: number;
  reajuste_adicional_value: number;
  margin_pct: number;
  total_planned_value: number;
  billing_day: number;
  approved_by_owner: boolean;
  is_critical: boolean;
  flow_released?: boolean;
  flow_released_at?: string | null;
  flow_review_requested?: boolean;
  flow_review_requested_at?: string | null;
  coordenador?: string;
  servico_1?: string;
  servico_2?: string;
  rotulo_1?: string;
  rotulo_2?: string;
  billing_profile?: BillingProfile | null;
  contract_details?: ContractDetails | null;
}

export interface Task {
  id: string;
  project_id: string;
  name: string;
  description: string;
  value: number;
  status: TaskStatus;
  responsible: string;
  email: string;
  due_date: string | null;
  created_at: string;
  etapa: string;          // Stage e.g. "Projeto", "Obras", "Sistemas Prediais", "Reajuste"
  navis_num: string;      // Navis code e.g. "05", "01", "08"
  status_nf: string;      // "Pago", "Concluído", "Nota Enviada", "Enviar Nota", "—"
  pagamento: string;      // "Nota Atrasada", "No Prazo", "—"
  date_previous: string | null;
  value_previous: number | null;
  gap_justification: string | null;
  launch_navis: 'Lançar' | 'Não Lançar';
  month_reference?: string;
  line_color?: string | null;
  change_indicator?: string | null;
  text_style?: string | null;
  additive_type?: string | null;
  new_flag?: string | null;
  date_changed?: boolean;
  value_changed?: boolean;
  name_changed?: boolean;
  is_new_faturavel?: boolean;
  check_mes?: string | null;
  flag_novo?: string | null;
}

export interface PreviousFlowRow {
  id: string;
  project_id: string;
  month: string;
  etapa: string;
  atividade: string;
  navis_num: string;
  value: number;
  date: string | null;
  status_nf: string;
  pagamento: string;
  date_previous: string | null;
  value_previous: number | null;
  gap_justification: string | null;
  launch_navis: 'Lançar' | 'Não Lançar';
  month_reference?: string;
  line_color?: string | null;
  change_indicator?: string | null;
  text_style?: string | null;
  additive_type?: string | null;
  new_flag?: string | null;
  date_changed?: boolean;
  value_changed?: boolean;
  name_changed?: boolean;
  is_new_faturavel?: boolean;
  check_mes?: string | null;
  flag_novo?: string | null;
}

export interface RawTaskRow {
  id: string;
  project_id: string;
  name: string;
  start_date: string | null;
  due_date: string | null;
  gap: string | null;
  status: string;
  responsible: string;
  contracted_value: number | null;
  planned_value: number | null;
  difference: number | null;
  consultant_hours: number | null;
  analyst_hours: number | null;
  intern_hours: number | null;
}

export interface ProjectStageSummary {
  projeto_id: string;
  projeto: number;
  eficiencia: number;
  carbono: number;
  materiais: number;
  obras: number;
  operacao: number;
  eventos: number;
  sistemas_prediais: number;
  conforto: number;
  acustica: number;
  rec: number;
  reajuste: number;
  retencao: number;
  repasse: number;
  taxa: number;
  total: number;
}

export interface InboxMessage {
  id: string;
  title: string;
  body: string;
  type: 'alert' | 'approval' | 'info' | 'warning';
  read: boolean;
  project_id: string | null;
  task_id: string | null;
  created_at: string;
}

export interface Integration {
  id: string;
  name: string;
  type: 'n8n' | 'wrike' | 'api';
  status: 'active' | 'inactive' | 'error';
  url: string;
  last_sync: string | null;
  created_at: string;
}

export interface Cliente {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  nome_empreendimento: string | null;
  inscricao_estadual: string | null;
  observacao_geral: string | null;
  preenchedor_nome: string | null;
  preenchedor_email: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  contato_tecnico_nome: string | null;
  contato_tecnico_cargo: string | null;
  contato_tecnico_telefone: string | null;
  contato_tecnico_email: string | null;
  contato_cobranca_nome: string | null;
  contato_cobranca_telefone: string | null;
  contato_cobranca_email: string | null;
  projeto_id: string | null;
  created_at: string;
  updated_at: string;
  isento_inscricao_estadual?: boolean | null;
  observacao_inscricao_estadual?: string | null;
  contatos_cobranca?: any | null;
  contatos_medicao?: any | null;
  // joined faturamento_perfil fields for list view convenience
  faturamento_status_formulario?: string | null;
  janela_medicao_inicio?: number | null;
  janela_medicao_fim?: number | null;
}

export interface FaturamentoPerfil {
  id: string;
  cliente_id: string;
  projeto_id: string | null;
  cobranca_mesmo_endereco: boolean | null;
  cobranca_endereco_completo: string | null;
  cobranca_cep: string | null;
  cobranca_cidade_uf: string | null;
  cobranca_observacoes: string | null;
  prazo_vencimento_dias: number | null;
  janela_medicao_inicio: number | null;
  janela_medicao_fim: number | null;
  periodo_medicao_inicio: number | null;
  periodo_medicao_fim: number | null;
  has_purchase_order: boolean | null;
  po_document_url: string | null;
  data_inicio_obra: string | null;
  data_fim_obra: string | null;
  elaborar_contrato: boolean | null;
  documentacao_necessaria: string[] | null;
  faturamento_mesmos_dados: boolean | null;
  faturamento_razao_social: string | null;
  faturamento_cnpj: string | null;
  faturamento_inscricao_estadual: string | null;
  faturamento_endereco: string | null;
  faturamento_cep: string | null;
  faturamento_cidade_uf: string | null;
  faturamento_obs_nf: string | null;
  necessita_art: boolean | null;
  art_mesmos_dados: boolean | null;
  art_razao_social: string | null;
  art_cnpj: string | null;
  art_endereco: string | null;
  art_cep: string | null;
  art_cidade_uf: string | null;
  art_endereco_obra: string | null;
  art_cep_obra: string | null;
  art_cidade_estado_obra: string | null;
  art_area_construida: number | null;
  art_finalidade_obra: string | null;
  art_autorizacao_art: boolean | null;
  feedback_nota: number | null;
  created_at: string;
  updated_at: string;
  status_formulario?: string | null;
  forma_pagamento?: string | null;
  condicoes_pagamento_obs?: string | null;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  fat: 'Faturar',
  vis: 'Visualização',
  agu: 'Aguard. Aprovação',
  apr: 'Aprovado',
};

export const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string; border: string }> = {
  fat: { bg: 'rgba(104,189,76,.14)', text: '#4fa832', border: 'rgba(104,189,76,.2)' },
  vis: { bg: 'rgba(0,139,149,.14)', text: '#007a83', border: 'rgba(0,139,149,.2)' },
  agu: { bg: 'rgba(241,90,41,.14)', text: '#d44e1a', border: 'rgba(241,90,41,.2)' },
  apr: { bg: 'rgba(163,76,157,.14)', text: '#8b3f87', border: 'rgba(163,76,157,.2)' },
};

export const CTE_COLORS = {
  cte1: '#002639',
  cte2: '#004d6d',
  cte3: '#58595b',
  cte4: '#939598',
  enredes: '#007a83',
  sustenta: '#4fa832',
  qualtech: '#d44e1a',
  autodoc: '#a81928',
  gerencia: '#8b3f87',
};
