-- Schema para Módulo de Qualidade (RNC + Planos de Ação)

-- 1. Tabela de Não Conformidades
CREATE TABLE IF NOT EXISTS nao_conformidade (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('PROCESSO', 'PRODUTO', 'SEGURANCA', 'AMBIENTAL', 'OUTROS')),
  origem VARCHAR(255) NOT NULL,
  data_ocorrencia TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('EM_ANALISE', 'ACAO_DEFINIDA', 'EM_EXECUCAO', 'CONCLUIDO', 'CANCELADO')),
  severidade VARCHAR(50) NOT NULL CHECK (severidade IN ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA')),
  responsavel_id VARCHAR(100) NOT NULL,
  acao_contencao TEXT,
  evidencias JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Análise de Causa (5 Porquês)
CREATE TABLE IF NOT EXISTS analise_causa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nao_conformidade_id UUID REFERENCES nao_conformidade(id) ON DELETE CASCADE,
  pq1 TEXT NOT NULL,
  pq2 TEXT,
  pq3 TEXT,
  pq4 TEXT,
  pq5 TEXT,
  causa_raiz TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Planos de Ação (5W2H)
CREATE TABLE IF NOT EXISTS plano_acao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nao_conformidade_id UUID REFERENCES nao_conformidade(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  what TEXT NOT NULL,  -- O que fazer
  why TEXT NOT NULL,   -- Por que fazer
  where_loc TEXT NOT NULL,  -- Onde fazer (WHERE é palavra reservada)
  when_date TIMESTAMPTZ NOT NULL,  -- Quando fazer
  who VARCHAR(255) NOT NULL,  -- Quem fará
  how TEXT NOT NULL,  -- Como fazer
  how_much VARCHAR(100),  -- Quanto custa
  status_acao VARCHAR(50) NOT NULL CHECK (status_acao IN ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'VERIFICADA')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Tarefas do Plano de Ação
CREATE TABLE IF NOT EXISTS tarefa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plano_acao_id UUID REFERENCES plano_acao(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  responsavel VARCHAR(255) NOT NULL,
  prazo TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Verificação de Eficácia
CREATE TABLE IF NOT EXISTS verificacao_eficacia (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nao_conformidade_id UUID REFERENCES nao_conformidade(id) ON DELETE CASCADE,
  eficaz BOOLEAN NOT NULL,
  data_verificacao TIMESTAMPTZ NOT NULL,
  observacoes TEXT,
  verificador_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE nao_conformidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE analise_causa ENABLE ROW LEVEL SECURITY;
ALTER TABLE plano_acao ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefa ENABLE ROW LEVEL SECURITY;
ALTER TABLE verificacao_eficacia ENABLE ROW LEVEL SECURITY;

-- Policies (Open for MVP)
CREATE POLICY "Public Access" ON nao_conformidade FOR ALL USING (true);
CREATE POLICY "Public Access" ON analise_causa FOR ALL USING (true);
CREATE POLICY "Public Access" ON plano_acao FOR ALL USING (true);
CREATE POLICY "Public Access" ON tarefa FOR ALL USING (true);
CREATE POLICY "Public Access" ON verificacao_eficacia FOR ALL USING (true);

-- Indexes para performance
CREATE INDEX idx_nc_status ON nao_conformidade(status);
CREATE INDEX idx_nc_severidade ON nao_conformidade(severidade);
CREATE INDEX idx_nc_data ON nao_conformidade(data_ocorrencia);
CREATE INDEX idx_plano_nc ON plano_acao(nao_conformidade_id);
CREATE INDEX idx_tarefa_plano ON tarefa(plano_acao_id);
CREATE INDEX idx_analise_nc ON analise_causa(nao_conformidade_id);
