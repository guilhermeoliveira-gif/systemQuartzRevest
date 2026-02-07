-- Schema para Módulo de Gestão de Projetos

-- 1. Tabela de Projetos
CREATE TABLE IF NOT EXISTS projeto (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  responsavel_id UUID REFERENCES usuarios(id),
  data_inicio DATE NOT NULL,
  data_fim_prevista DATE NOT NULL,
  data_fim_real DATE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('PLANEJAMENTO', 'EM_ANDAMENTO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO')),
  prioridade VARCHAR(50) NOT NULL CHECK (prioridade IN ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE')),
  progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  orcamento DECIMAL(15,2),
  custo_real DECIMAL(15,2),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Tarefas do Projeto
CREATE TABLE IF NOT EXISTS tarefa_projeto (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES projeto(id) ON DELETE CASCADE NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  responsavel_id UUID REFERENCES usuarios(id),
  data_inicio DATE,
  data_fim_prevista DATE NOT NULL,
  data_fim_real DATE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('PENDENTE', 'EM_ANDAMENTO', 'BLOQUEADA', 'CONCLUIDA', 'CANCELADA')),
  prioridade VARCHAR(50) NOT NULL CHECK (prioridade IN ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE')),
  progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  horas_estimadas DECIMAL(10,2),
  horas_realizadas DECIMAL(10,2),
  dependencias JSONB DEFAULT '[]'::jsonb, -- IDs de tarefas que bloqueiam esta
  tags JSONB DEFAULT '[]'::jsonb,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Comentários (Opcional - para discussões)
CREATE TABLE IF NOT EXISTS comentario_projeto (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES projeto(id) ON DELETE CASCADE,
  tarefa_id UUID REFERENCES tarefa_projeto(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) NOT NULL,
  comentario TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (projeto_id IS NOT NULL OR tarefa_id IS NOT NULL)
);

-- 4. Tabela de Anexos (Opcional)
CREATE TABLE IF NOT EXISTS anexo_projeto (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES projeto(id) ON DELETE CASCADE,
  tarefa_id UUID REFERENCES tarefa_projeto(id) ON DELETE CASCADE,
  nome_arquivo VARCHAR(255) NOT NULL,
  url_arquivo TEXT NOT NULL,
  tipo_arquivo VARCHAR(100),
  tamanho_bytes BIGINT,
  usuario_id UUID REFERENCES usuarios(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (projeto_id IS NOT NULL OR tarefa_id IS NOT NULL)
);

-- Enable Row Level Security
ALTER TABLE projeto ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefa_projeto ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentario_projeto ENABLE ROW LEVEL SECURITY;
ALTER TABLE anexo_projeto ENABLE ROW LEVEL SECURITY;

-- Policies (Open for MVP)
CREATE POLICY "Public Access" ON projeto FOR ALL USING (true);
CREATE POLICY "Public Access" ON tarefa_projeto FOR ALL USING (true);
CREATE POLICY "Public Access" ON comentario_projeto FOR ALL USING (true);
CREATE POLICY "Public Access" ON anexo_projeto FOR ALL USING (true);

-- Indexes para performance
CREATE INDEX idx_projeto_status ON projeto(status);
CREATE INDEX idx_projeto_responsavel ON projeto(responsavel_id);
CREATE INDEX idx_projeto_data_fim ON projeto(data_fim_prevista);
CREATE INDEX idx_tarefa_projeto ON tarefa_projeto(projeto_id);
CREATE INDEX idx_tarefa_responsavel ON tarefa_projeto(responsavel_id);
CREATE INDEX idx_tarefa_status ON tarefa_projeto(status);
CREATE INDEX idx_comentario_projeto ON comentario_projeto(projeto_id);
CREATE INDEX idx_comentario_tarefa ON comentario_projeto(tarefa_id);
CREATE INDEX idx_anexo_projeto ON anexo_projeto(projeto_id);
CREATE INDEX idx_anexo_tarefa ON anexo_projeto(tarefa_id);

-- Função para atualizar progresso do projeto baseado nas tarefas
CREATE OR REPLACE FUNCTION atualizar_progresso_projeto()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projeto
  SET progresso = (
    SELECT COALESCE(AVG(progresso), 0)::INTEGER
    FROM tarefa_projeto
    WHERE projeto_id = NEW.projeto_id
  ),
  updated_at = NOW()
  WHERE id = NEW.projeto_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar progresso automaticamente
DROP TRIGGER IF EXISTS trigger_atualizar_progresso ON tarefa_projeto;
CREATE TRIGGER trigger_atualizar_progresso
  AFTER INSERT OR UPDATE OF progresso, status ON tarefa_projeto
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_progresso_projeto();

-- Inserir dados de exemplo (opcional)
INSERT INTO projeto (nome, descricao, responsavel_id, data_inicio, data_fim_prevista, status, prioridade, progresso) VALUES
  ('Implementação ERP', 'Projeto de implementação do sistema ERP completo', NULL, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', 'EM_ANDAMENTO', 'ALTA', 35),
  ('Melhoria Contínua Q1', 'Iniciativas de melhoria contínua do primeiro trimestre', NULL, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '60 days', 'EM_ANDAMENTO', 'MEDIA', 60),
  ('Auditoria ISO 9001', 'Preparação para auditoria de certificação ISO 9001', NULL, CURRENT_DATE, CURRENT_DATE + INTERVAL '120 days', 'PLANEJAMENTO', 'URGENTE', 10)
ON CONFLICT DO NOTHING;
