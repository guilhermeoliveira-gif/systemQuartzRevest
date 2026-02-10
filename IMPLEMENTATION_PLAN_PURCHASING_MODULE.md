# IMPLANTAÇÃO MÓDULO DE COMPRAS (PURCHASING MODULE)

Este documento detalha o plano de implementação do Módulo de Compras, abrangendo Cadastro de Fornecedores, Pedidos de Compra (Requisições), Workflow de Aprovação e Gestão de Cotações.

## 🎯 OBJETIVOS
1. **Centralizar Compras**: Gerenciar todas as solicitações de compra em um único local.
2. **Workflow de Aprovação**: Garantir que compras sejam aprovadas pelas alçadas corretas.
3. **Gestão de Cotações**: Facilitar o processo de cotação com múltiplos fornecedores e seleção da melhor proposta.
4. **Histórico e Rastreabilidade**: Manter registro de todas as etapas, desde a solicitação até a entrega.

---

## 📋 ETAPAS DE IMPLEMENTAÇÃO

### FASE 1: BANCO DE DADOS (SUPABASE)
**Objetivo**: Criar a estrutura de dados para suportar o fluxo de compras.

- [ ] **Tabela `fornecedores`**:
    - Campos: `nome`, `cnpj`, `email`, `telefone`, `endereco`, `categoria`, `status` (Ativo/Inativo).
- [ ] **Tabela `pedidos_compra`** (Requisição):
    - Campos: `titulo`, `urgencia` (Baixa, Normal, Alta, Urgente), `departamento`, `data_entrega_desejada`, `descricao`, `justificativa`, `status` (Rascunho, Pendente, Em Aprovação, Aprovado, Rejeitado, Em Cotação, Concluído), `solicitante_id`.
- [ ] **Tabela `itens_pedido_compra`**:
    - Campos: `pedido_id`, `descricao_item`, `quantidade`, `unidade`, `preco_estimado`, `especificacao_tecnica`, `requisitos_tecnicos`.
- [ ] **Tabela `cotacoes`** (RFQ):
    - Campos: `pedido_id`, `titulo`, `data_abertura`, `prazo_resposta`, `status` (Aberta, Fechada, Analise, Concluida), `itens_solicitados` (JSON ou Relacional?), `fornecedores_convidados` (Array ou Relacional).
- [ ] **Tabela `propostas_cotacao`**:
    - Campos: `cotacao_id`, `fornecedor_id`, `valor_total`, `data_resposta`, `status` (Recebida, Vencedora, Rejeitada), `anexo_url`.

### FASE 2: UI - CADASTROS E LISTAGENS
**Objetivo**: Interfaces básicas para gestão.

- [ ] **Menu Lateral**: Adicionar item "Compras".
- [ ] **Página Fornecedores**:
    - Listagem (DataGrid).
    - Modal de Cadastro/Edição.
- [ ] **Página Pedidos de Compra (Minhas Solicitações)**:
    - Listagem de pedidos do usuário (Abas: Todos, Rascunhos, Em Aprovação, Aprovados).
    - Cards de status (KPIs rápidos).

### FASE 3: UI - CRIAÇÃO DE PEDIDO (FORMULÁRIO)
**Objetivo**: Implementar o formulário complexo de solicitação conforme prints.

- [ ] **Formulário de Pedido**:
    - Cabeçalho: Título, Urgência, Depto, Workflow.
    - Detalhes: Data, Descrição, Justificativa.
- [ ] **Sub-formulário de Itens**:
    - Adicionar/Remover itens dinamicamente.
    - Campos detalhados por item.
- [ ] **Ações**: Salvar Rascunho, Enviar para Aprovação.

### FASE 4: WORKFLOW E APROVAÇÃO
**Objetivo**: Lógica de mudança de status e permissões.

- [ ] **Lógica de Aprovação**:
    - Se Workflow simples, apenas muda status.
    - Se dinâmico (a definir), regra de quem pode aprovar.
- [ ] **Visualização para Aprovador**:
    - Botões "Aprovar" / "Rejeitar" (com motivo).

### FASE 5: GESTÃO DE COTAÇÕES
**Objetivo**: Transformar pedidos aprovados em cotações.

- [ ] **Painel de Cotações**:
    - Listar pedidos aprovados prontos para cotar.
    - Botão "Nova Cotação" (RFQ).
- [ ] **Formulário de Cotação**:
    - Selecionar Fornecedores.
    - Definir Prazos.
- [ ] **Registro de Propostas**:
    - Input manual das propostas recebidas (ou link externo se evoluído).
    - Comparativo de preços.
    - Seleção da Vencedora (Gera Ordem de Compra ou Finaliza).

---

## 🛠️ TECNOLOGIAS E PADRÕES
- **Frontend**: React, Tailwind CSS, Lucide Icons.
- **Backend**: Supabase (Postgres, RLS, Edge Functions se necessário).
- **Estado**: React Query (Gerenciamento de Server State).
- **Formulários**: React Hook Form + Zod.

