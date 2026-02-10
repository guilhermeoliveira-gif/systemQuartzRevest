-- MIGRATION: Módulo de Compras (Purchasing)
-- Criação das tabelas para gestão de compras, fornecedores e cotações

-- 1. Tabela de Fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255),
  cnpj VARCHAR(20),
  email VARCHAR(255),
  telefone VARCHAR(50),
  endereco TEXT,
  categoria VARCHAR(100), -- Ex: Material de Escritório, Peças, Serviços
  status VARCHAR(20) DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Pedidos de Compra (Requisições)
CREATE TABLE IF NOT EXISTS pedidos_compra (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  codigo VARCHAR(50), -- Sequencial legível ex: RC-2024-001 (Gerado via trigger ou app)
  urgencia VARCHAR(20) NOT NULL CHECK (urgencia IN ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE')),
  departamento VARCHAR(100),
  workflow_tipo VARCHAR(100), -- Apenas informativo conforme solicitado (sem engine complexa)
  data_entrega_desejada DATE,
  descricao TEXT,
  justificativa_negocio TEXT,
  status VARCHAR(50) DEFAULT 'RASCUNHO' CHECK (status IN ('RASCUNHO', 'PENDENTE', 'EM_APROVACAO', 'APROVADO', 'REJEITADO', 'EM_COTACAO', 'CONCLUIDO', 'CANCELADO')),
  solicitante_id UUID REFERENCES auth.users(id), -- Se usar auth do supabase
  aprovador_id UUID REFERENCES auth.users(id),
  data_aprovacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Itens do Pedido de Compra
CREATE TABLE IF NOT EXISTS itens_pedido_compra (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES pedidos_compra(id) ON DELETE CASCADE,
  descricao VARCHAR(255) NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL,
  unidade VARCHAR(20) DEFAULT 'UN',
  preco_estimado DECIMAL(10,2),
  especificacao_tecnica TEXT,
  requisitos_tecnicos TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Cotações (RFQ - Request for Quotation) -> Vincula a um ou mais pedidos (geralmente 1:1 ou 1:N)
CREATE TABLE IF NOT EXISTS cotacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES pedidos_compra(id), -- Link opcional se for cotação avulsa, mas idealmente vinculada
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_abertura TIMESTAMPTZ DEFAULT NOW(),
  prazo_resposta DATE,
  status VARCHAR(50) DEFAULT 'ABERTA' CHECK (status IN ('RASCUNHO', 'ABERTA', 'ANALISE', 'FECHADA', 'CONCLUIDA')),
  responsavel_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Itens da Cotação (Pode ser cópia dos itens do pedido ou agrupado)
-- Para simplificar, vamos assumir que a cotação puxa os itens do pedido, mas tabelas separadas permitem flexibilidade
CREATE TABLE IF NOT EXISTS itens_cotacao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotacao_id UUID NOT NULL REFERENCES cotacoes(id) ON DELETE CASCADE,
  item_pedido_id UUID REFERENCES itens_pedido_compra(id), -- Rastreabilidade
  descricao VARCHAR(255) NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL,
  unidade VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Fornecedores Convidados na Cotação
CREATE TABLE IF NOT EXISTS cotacao_fornecedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotacao_id UUID NOT NULL REFERENCES cotacoes(id) ON DELETE CASCADE,
  fornecedor_id UUID NOT NULL REFERENCES fornecedores(id),
  status VARCHAR(50) DEFAULT 'CONVIDADO', -- CONVIDADO, VISUALIZADO, RESPONDIDO, DECLINADO
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cotacao_id, fornecedor_id)
);

-- 7. Propostas Recebidas (Valores)
CREATE TABLE IF NOT EXISTS propostas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotacao_id UUID NOT NULL REFERENCES cotacoes(id) ON DELETE CASCADE,
  fornecedor_id UUID NOT NULL REFERENCES fornecedores(id),
  cotacao_fornecedor_id UUID REFERENCES cotacao_fornecedores(id),
  valor_total DECIMAL(10,2),
  prazo_entrega_dias INT,
  validade_proposta DATE,
  observacoes TEXT,
  anexo_url TEXT,
  is_vencedora BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Itens da Proposta (Preço por item)
CREATE TABLE IF NOT EXISTS itens_proposta (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposta_id UUID NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
  item_cotacao_id UUID NOT NULL REFERENCES itens_cotacao(id),
  preco_unitario DECIMAL(10,2) NOT NULL,
  quantidade_ofertada DECIMAL(10,2), -- Pode ser parcial
  valor_total_item DECIMAL(10,2), -- unitario * qtd
  marca_modelo VARCHAR(255),
  observacao VARCHAR(255),
  is_vencedor BOOLEAN DEFAULT FALSE, -- Pode ganhar item a item
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (Básico: Todos Autenticados podem ler/escrever para MVP)
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_cotacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotacao_fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_proposta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso Total Fornecedores" ON fornecedores FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso Total Pedidos" ON pedidos_compra FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso Total Itens Pedido" ON itens_pedido_compra FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso Total Cotacoes" ON cotacoes FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso Total Itens Cotacao" ON itens_cotacao FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso Total Cotacao Fornecedores" ON cotacao_fornecedores FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso Total Propostas" ON propostas FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso Total Itens Proposta" ON itens_proposta FOR ALL TO authenticated USING (true);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos_compra(status);
CREATE INDEX IF NOT EXISTS idx_cotacoes_status ON cotacoes(status);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido_id ON itens_pedido_compra(pedido_id);
CREATE INDEX IF NOT EXISTS idx_itens_cotacao_cotacao_id ON itens_cotacao(cotacao_id);
