-- Schema para Módulo de Segurança (Usuários, Perfis e Permissões)

-- 1. Tabela de Perfis (Roles)
CREATE TABLE IF NOT EXISTS perfil (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Funcionalidades (Recursos do Sistema)
CREATE TABLE IF NOT EXISTS funcionalidade (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  modulo VARCHAR(100) NOT NULL, -- 'ESTOQUE', 'QUALIDADE', 'SEGURANCA', etc.
  nome VARCHAR(100) NOT NULL, -- 'CADASTRO_MP', 'PLANOS_ACAO', etc.
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Permissões (Perfil x Funcionalidade)
CREATE TABLE IF NOT EXISTS permissao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  perfil_id UUID REFERENCES perfil(id) ON DELETE CASCADE,
  funcionalidade_id UUID REFERENCES funcionalidade(id) ON DELETE CASCADE,
  pode_visualizar BOOLEAN DEFAULT false,
  pode_criar BOOLEAN DEFAULT false,
  pode_editar BOOLEAN DEFAULT false,
  pode_excluir BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(perfil_id, funcionalidade_id)
);

-- 4. Atualizar tabela usuarios (já existe de auth) para incluir perfil
-- Adicionar coluna perfil_id na tabela usuarios existente
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS perfil_id UUID REFERENCES perfil(id);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- Enable Row Level Security
ALTER TABLE perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionalidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissao ENABLE ROW LEVEL SECURITY;

-- Policies (Open for MVP - ajustar depois)
CREATE POLICY "Public Access" ON perfil FOR ALL USING (true);
CREATE POLICY "Public Access" ON funcionalidade FOR ALL USING (true);
CREATE POLICY "Public Access" ON permissao FOR ALL USING (true);

-- Indexes para performance
CREATE INDEX idx_permissao_perfil ON permissao(perfil_id);
CREATE INDEX idx_permissao_funcionalidade ON permissao(funcionalidade_id);
CREATE INDEX idx_usuarios_perfil ON usuarios(perfil_id);

-- Inserir Perfis Padrão
INSERT INTO perfil (nome, descricao) VALUES
  ('Administrador', 'Acesso total ao sistema'),
  ('Gerente', 'Acesso de gerenciamento e relatórios'),
  ('Operador', 'Acesso operacional básico'),
  ('Visualizador', 'Apenas visualização de dados')
ON CONFLICT (nome) DO NOTHING;

-- Inserir Funcionalidades Padrão
INSERT INTO funcionalidade (modulo, nome, descricao) VALUES
  -- Módulo Estoque
  ('ESTOQUE', 'DASHBOARD', 'Dashboard de Estoque'),
  ('ESTOQUE', 'CADASTRO_MP', 'Cadastro de Matéria-Prima'),
  ('ESTOQUE', 'CADASTRO_PA', 'Cadastro de Produto Acabado'),
  ('ESTOQUE', 'CADASTRO_PECAS', 'Cadastro de Peças e Insumos'),
  ('ESTOQUE', 'CADASTRO_FORMULA', 'Cadastro de Fórmulas'),
  ('ESTOQUE', 'ENTRADA_MATERIAL', 'Entrada de Material'),
  ('ESTOQUE', 'CONTROLE_PRODUCAO', 'Controle de Produção'),
  ('ESTOQUE', 'CONFERENCIA', 'Conferência de Estoque'),
  ('ESTOQUE', 'RELATORIOS', 'Relatórios de Estoque'),
  ('ESTOQUE', 'CONFIGURACOES', 'Configurações de Estoque'),
  
  -- Módulo Qualidade
  ('QUALIDADE', 'NAO_CONFORMIDADES', 'Gestão de Não Conformidades'),
  ('QUALIDADE', 'PLANOS_ACAO', 'Planos de Ação (5W2H)'),
  ('QUALIDADE', 'TAREFAS', 'Minhas Tarefas'),
  ('QUALIDADE', 'CONFIGURACOES', 'Configurações de Qualidade'),
  
  -- Módulo Segurança
  ('SEGURANCA', 'USUARIOS', 'Cadastro de Usuários'),
  ('SEGURANCA', 'PERFIS', 'Cadastro de Perfis'),
  ('SEGURANCA', 'PERMISSOES', 'Perfil x Funcionalidade')
ON CONFLICT DO NOTHING;

-- Criar permissões totais para Administrador
DO $$
DECLARE
  admin_perfil_id UUID;
  func RECORD;
BEGIN
  SELECT id INTO admin_perfil_id FROM perfil WHERE nome = 'Administrador' LIMIT 1;
  
  IF admin_perfil_id IS NOT NULL THEN
    FOR func IN SELECT id FROM funcionalidade LOOP
      INSERT INTO permissao (perfil_id, funcionalidade_id, pode_visualizar, pode_criar, pode_editar, pode_excluir)
      VALUES (admin_perfil_id, func.id, true, true, true, true)
      ON CONFLICT (perfil_id, funcionalidade_id) DO NOTHING;
    END LOOP;
  END IF;
END $$;
