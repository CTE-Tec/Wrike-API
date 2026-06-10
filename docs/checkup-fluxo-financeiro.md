# Checkup do Fluxo Financeiro Wrike

Data do checkup: 2026-06-10

## Veredito executivo

O projeto esta no caminho visual correto, mas ainda nao esta condizente com o pedido completo do cliente para operacao real.

O front-end ja mostra partes importantes do fluxo financeiro: projetos, tarefas/parcelas, owner, tabela estilo Excel, acoes por projeto, dashboard, perfil de faturamento e contratos. Porem, hoje ele ainda depende de mock por padrao, varias acoes alteram apenas estado local, o schema versionado no repo esta bem atrasado em relacao ao TypeScript/n8n, e o n8n atual escreve campos/tabelas que nao existem na migration atual.

O ponto mais critico: o n8n usa IDs do Wrike como `projects.id` e `tasks.id`, mas o banco versionado usa `uuid`. Isso quebra a persistencia se a migration atual for aplicada como esta. A recomendacao e manter UUID interno e adicionar `wrike_folder_id` / `wrike_task_id`, ajustando o n8n para fazer upsert por esses campos.

## Fontes analisadas

- Projeto local React/Next em `C:\Users\GustavoSantos\Downloads\Wrike-API-1`.
- Planilha `ST28576-25-FLX-FIN-2603-R00 OK medição liberada.xlsm`.
- Workflow n8n `Fluxo de Aprovação Financeiro - Salvar Supabase V2.json`.
- Pedido do cliente colado em `Olá, td joia Eu tenho esse projeto.txt`.
- O link do Notion foi tentado, mas nao estava acessivel/publico no ambiente de analise; usei o resumo colado no TXT.

## Resultado tecnico local

- `npm run typecheck`: passou.
- `npm run build`: passou. O aviso de workspace root do Next foi corrigido fixando `outputFileTracingRoot` em `next.config.mjs`.
- `npm run lint`: estava falhando por varrer `.next` e `next-env.d.ts`; ajustei `eslint.config.js`. Agora passa com 2 warnings de Fast Refresh.
- O build mostra `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` ausentes, entao o app cai em mock (`NEXT_PUBLIC_USE_MOCKS !== 'false'`).

## Mapeamento da planilha

### Abas

- `INSTRUÇÕES`: instrucoes operacionais e legenda visual.
- `Tasks`: exportacao bruta do Wrike.
- `Mês Atual`: tabela financeira principal e formulas.
- `Mês Anterior`: snapshot aprovado do mes anterior.
- `Planejado x Contratado`: aba oculta de apoio para diferenca percentual.

A planilha tem VBA (`vbaProject.bin`, cerca de 48 KB), aparentemente ligado a macro/grafico. A regra de negocio principal, entretanto, esta nas formulas e formatacoes condicionais.

### Campos de entrada do Wrike (`Tasks`)

| Coluna | Campo |
|---|---|
| A | Nome |
| B | Data inicial |
| C | Vencimento |
| D | GAP |
| E | Status |
| F | Responsavel |
| G | Valor Contratado |
| H | $ Valor Planejado |
| I | Diferenca $ |
| J | Consultor |
| K | Analista |
| L | Estagiario |

### Campos visiveis obrigatorios no fluxo (`Mês Atual` B:L)

| Coluna | Campo | Regra principal |
|---|---|---|
| B | ETAPA | Busca pelo codigo/nucleo da atividade. |
| C | ATIVIDADE | Tarefa do Wrike com valor contratado preenchido. |
| D | N.° Navis | Codigo entre os hifens da atividade, com prefixo AC/AD quando aplicavel. |
| E | VALOR | Valor contratado normalizado de `Tasks!G`. |
| F | DATA | Data de conclusao da atividade, vinda de `Tasks!C`. |
| G | STATUS NF | Derivado do mes atual e dos status ativos. |
| H | PAGAMENTO | Marca atraso quando a parcela passou do mes e nao esta paga. |
| I | DATA ANTERIOR | Data do snapshot anterior quando ano/mes mudou. |
| J | VALOR ANTERIOR | Valor do snapshot anterior quando o valor mudou. |
| K | Justificativa GAP | Usa GAP do Wrike ou exige `Justificar GAP no Wrike`. |
| L | LANÇAR NAVIS | `Não Lançar` para status inativos. |

### Campos auxiliares da planilha

- `N`: Entregavel/Atividade.
- `O`: Etapa recalculada.
- `P`: Status Nota Fiscal.
- `Q`: Pagamento.
- `R`: Ano Anterior.
- `S`: Mês Anterior.
- `T`: Mudança de Data.
- `U`: Valor Anterior.
- `V`: Lançar no Navis.
- `W`: Aditivo.
- `X`: Novo Faturável?.

### Codigos de nucleo

| Codigo | Nucleo |
|---|---|
| 01 | Projeto |
| 02 | Eficiência |
| 03 | Interiores |
| 04 | Materiais |
| 05 | Obras |
| 06 | Operação |
| 07 | Palestras |
| 08 | Sistemas Prediais |
| 09 | Urbanismo |
| RE | Reajuste |
| TA | Taxas |

### Status da planilha

Status ativos para NF:

- `Concluído`
- `Nota Enviada`
- `Pago`

Status inativos para Navis:

- `Sem Previsão`
- `Cancelado`

### Regras visuais da planilha

- Linha azul em `B:L`: quando `STATUS NF = "Enviar Nota"`.
- Linha/celula verde: quando `Novo Faturável? = "NOVO"`.
- Texto cinza claro e tachado: quando `LANÇAR NAVIS = "Não Lançar"`.
- Borda vermelha em data/valor/anterior/GAP: quando data ou valor diferem do mes anterior.
- Celula GAP em vermelho: quando precisa justificar no Wrike.
- Celula de comparacao Navis em vermelho: quando o valor lancado no Navis esta menor que o total esperado.

## Gaps do front-end

### Atendido parcialmente

- A tela `Faturamento` respeita a ideia de tabela e possui colunas muito proximas da planilha.
- Owner aparece em destaque na tela de faturamento.
- Existem botoes de projeto para medicoes, faturamento e pagamento.
- Dashboard tem barra horizontal acumulada, filtro por owner e indicadores de SLA.
- Existem telas para perfil de faturamento e contratos.

### Gaps importantes

- As acoes em `Faturamento` alteram apenas estado local; nao persistem no Supabase nem atualizam Wrike.
- `Dashboard` usa SLA de medicao hardcoded em `94`.
- `CadastroFaturamento` salva perfil, mas ainda nao automatiza Receita Federal/CNPJ nem fluxo novo cliente vs aditivo de forma completa.
- `Clientes` ainda e placeholder.
- A tela `Projects` ainda usa o termo `Vencimento`; o cliente pediu trocar por `data de conclusão da atividade`.
- O calculo de `N.° Navis` no front usa `split('-')[3]`; funciona em alguns nomes, mas nao cobre bem excecoes da planilha, AC/AD e tarefas sem o padrao completo.
- Ha duplicidade de estrutura entre `src/app` e `src/pages`, aumentando superficie de manutencao.

## Gaps do banco

### Criticos

- Migration versionada cria `projects.id uuid` e `tasks.id uuid`, enquanto o n8n envia IDs Wrike textuais nesses campos.
- Migration versionada nao tem `client`, `area`, `owner`, `label_code`, `flow_date`, valores de contrato, `billing_day`, `approved_by_owner`, `is_critical`.
- Migration versionada nao tem `etapa`, `navis_num`, `status_nf`, `pagamento`, `date_previous`, `value_previous`, `gap_justification`, `launch_navis`.
- Nao existem `billing_profiles`, `contract_details`, `project_snapshots`, `task_snapshots`, `flow_approvals` na migration atual do repo.
- O n8n escreve `wrike_task_id`, `valor_contratado`, `valor_planejado`, `horas_consultor`, `horas_analista`, `horas_estagiario`, `is_aditivo`, `is_novo_faturavel`, mas esses campos nao existem na migration atual.
- O schema atual nao armazena historico mensal suficiente para replicar `Mês Atual` vs `Mês Anterior`.

### Recomendacao aplicada em arquivo

Criei a migration:

`supabase/migrations/20260610143000_002_financial_flow_excel_parity.sql`

Ela adiciona:

- IDs do Wrike separados (`wrike_folder_id`, `wrike_task_id`).
- Campos da planilha e do n8n.
- Tabelas auxiliares de codigo/etapa e regras de status.
- Snapshots mensais de projetos e tarefas.
- `flow_approvals` para aprovar medicao ou fluxo completo.
- `project_status_events` para botoes de medicao/faturamento/pagamento.
- `billing_profiles`, `contract_details`, `integration_sync_runs`.
- Views `view_task_comparisons`, `view_financial_flow_rows`, `view_monthly_billing_dashboard`.

## Gaps do n8n

### O que o fluxo atual faz

- Workflow ativo com 27 nodes.
- Webhook `aprovar-fluxo`.
- Atualiza campo customizado do Wrike para marcar fluxo aprovado.
- Busca projeto, owner, subprojetos e tarefas no Wrike.
- Prepara dados e grava `projects`, `tasks`, `flow_approvals` e `inbox_messages` no Supabase.

### Problemas

- Usa `projects.id` e `tasks.id` com IDs Wrike textuais, incompatibilizando com UUID.
- Usa `Create Task`, nao upsert; se rodar de novo com a mesma tarefa tende a duplicar/falhar.
- Usa `flow_approvals`, mas a tabela nao existe no schema versionado atual.
- Ainda busca tarefas por subprojetos; o cliente pediu organizacao por projeto raiz.
- O filtro atual busca tarefas com campo financeiro preenchido, mas nao garante "apenas concluidas do mes atual".
- So cobre aprovacao de fluxo completo. O pedido da sprint pede tres acoes: `Revisar Fluxo`, `Aprovar Medição`, `Aprovar Fluxo`.
- Nao ha fluxo de volta para Wrike para `Medições enviadas`, `Notas faturadas` e `Pago`.
- Nao ha integracao Naves real; o campo `launch_navis` esta apenas preparado.

## Matriz de prioridade

| Prioridade | Item | Por que importa |
|---|---|---|
| P0 | Alinhar schema Supabase com n8n/front | Sem isso a persistencia real quebra. |
| P0 | Ajustar n8n para upsert por `wrike_folder_id`/`wrike_task_id` | Evita conflito UUID e duplicidade mensal. |
| P0 | Criar snapshots mensais aprovados | Necessario para data anterior, valor anterior, NOVO e GAP. |
| P1 | Reproduzir formulas da planilha no banco/views | Tira regra critica do front e deixa auditavel. |
| P1 | Persistir botoes de projeto e atualizar Wrike | Cliente pediu bidirecionalidade de status. |
| P1 | Corrigir filtro de tarefas concluidas do mes atual | Pedido explicito da Sprint 02. |
| P1 | Separar aprovacao de medicao e fluxo completo | Pedido explicito da Sprint 02. |
| P2 | Completar perfil de faturamento/CNPJ/Receita | Importante, mas depois da tabela principal. |
| P2 | Completar contratos, FUP e reajustes mensais | Modulo relevante, mas nao e o coracao inicial. |
| P3 | Dashboard final e SLAs reais | Deve vir depois que dados e eventos estiverem confiaveis. |

## Proximos passos recomendados

1. Aplicar a migration em ambiente de teste do Supabase.
2. Ajustar o n8n para:
   - nao escrever `id`;
   - upsertar projeto por `wrike_folder_id`;
   - upsertar tarefa por `wrike_task_id`;
   - usar o `project_id` UUID retornado pelo Supabase;
   - gravar snapshots apenas quando aprovado.
3. Alterar o front para consumir as views `view_financial_flow_rows` e `view_monthly_billing_dashboard`.
4. Persistir os botoes de medicao/faturamento/pagamento em `project_status_events` e disparar update no Wrike.
5. Trocar textos remanescentes de `Vencimento` para `Data de conclusão da atividade`.
6. Validar a estrutura da tabela com Adriana/Marcela antes de expandir dashboard e contratos.
