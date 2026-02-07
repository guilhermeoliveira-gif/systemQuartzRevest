-- Schema para Melhorias de Estoque: Alertas e Controle de Estoque Mínimo

-- 1. Adicionar campos de controle de estoque nas tabelas existentes

-- Matéria-Prima
ALTER TABLE materia_prima 
ADD COLUMN IF NOT EXISTS estoque_minimo DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS estoque_atual DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS unidade_medida VARCHAR(20) DEFAULT 'KG',
ADD COLUMN IF NOT EXISTS alerta_ativo BOOLEAN DEFAULT TRUE;

-- Produto Acabado
ALTER TABLE produto_acabado 
ADD COLUMN IF NOT EXISTS estoque_minimo DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS estoque_atual DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS unidade_medida VARCHAR(20) DEFAULT 'UN',
ADD COLUMN IF NOT EXISTS alerta_ativo BOOLEAN DEFAULT TRUE;

-- 2. Tabela de Histórico de Movimentações
CREATE TABLE IF NOT EXISTS historico_movimentacao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_item VARCHAR(50) NOT NULL CHECK (tipo_item IN ('MATERIA_PRIMA', 'PRODUTO_ACABADO', 'PECA')),
  item_id UUID NOT NULL,
  item_nome VARCHAR(255) NOT NULL,
  tipo_movimentacao VARCHAR(50) NOT NULL CHECK (tipo_movimentacao IN ('ENTRADA', 'SAIDA', 'AJUSTE', 'TRANSFERENCIA', 'PRODUCAO')),
  quantidade DECIMAL(10,2) NOT NULL,
  estoque_anterior DECIMAL(10,2) NOT NULL,
  estoque_novo DECIMAL(10,2) NOT NULL,
  responsavel_id UUID REFERENCES usuarios(id),
  motivo TEXT,
  documento VARCHAR(100), -- Número da NF, OP, etc
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Ajustes de Estoque (com justificativa obrigatória)
CREATE TABLE IF NOT EXISTS ajuste_estoque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_item VARCHAR(50) NOT NULL CHECK (tipo_item IN ('MATERIA_PRIMA', 'PRODUTO_ACABADO', 'PECA')),
  item_id UUID NOT NULL,
  item_nome VARCHAR(255) NOT NULL,
  quantidade_anterior DECIMAL(10,2) NOT NULL,
  quantidade_nova DECIMAL(10,2) NOT NULL,
  diferenca DECIMAL(10,2) NOT NULL,
  percentual_diferenca DECIMAL(5,2) NOT NULL,
  motivo TEXT NOT NULL, -- Obrigatório
  responsavel_id UUID REFERENCES usuarios(id) NOT NULL,
  aprovado_por_id UUID REFERENCES usuarios(id),
  status VARCHAR(50) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'APROVADO', 'REJEITADO')),
  nc_gerada_id UUID REFERENCES nao_conformidade(id), -- NC automática se > 10%
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

-- 4. Tabela de Alertas de Estoque
CREATE TABLE IF NOT EXISTS alerta_estoque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_item VARCHAR(50) NOT NULL CHECK (tipo_item IN ('MATERIA_PRIMA', 'PRODUTO_ACABADO', 'PECA')),
  item_id UUID NOT NULL,
  item_nome VARCHAR(255) NOT NULL,
  estoque_atual DECIMAL(10,2) NOT NULL,
  estoque_minimo DECIMAL(10,2) NOT NULL,
  percentual_estoque DECIMAL(5,2) NOT NULL, -- % do estoque atual vs mínimo
  nivel_alerta VARCHAR(20) CHECK (nivel_alerta IN ('CRITICO', 'BAIXO', 'NORMAL')),
  notificado BOOLEAN DEFAULT FALSE,
  data_notificacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE historico_movimentacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE ajuste_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerta_estoque ENABLE ROW LEVEL SECURITY;

-- Policies (acesso público autenticado por enquanto)
CREATE POLICY "Todos podem ver histórico" ON historico_movimentacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Todos podem inserir histórico" ON historico_movimentacao FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Todos podem ver ajustes" ON ajuste_estoque FOR ALL TO authenticated USING (true);
CREATE POLICY "Todos podem ver alertas" ON alerta_estoque FOR ALL TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_historico_item ON historico_movimentacao(item_id, tipo_item);
CREATE INDEX IF NOT EXISTS idx_historico_created ON historico_movimentacao(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ajuste_status ON ajuste_estoque(status);
CREATE INDEX IF NOT EXISTS idx_alerta_notificado ON alerta_estoque(notificado);
CREATE INDEX IF NOT EXISTS idx_alerta_nivel ON alerta_estoque(nivel_alerta);

-- 5. Função para registrar movimentação automática
CREATE OR REPLACE FUNCTION registrar_movimentacao(
  p_tipo_item VARCHAR,
  p_item_id UUID,
  p_item_nome VARCHAR,
  p_tipo_movimentacao VARCHAR,
  p_quantidade DECIMAL,
  p_estoque_anterior DECIMAL,
  p_estoque_novo DECIMAL,
  p_responsavel_id UUID DEFAULT NULL,
  p_motivo TEXT DEFAULT NULL,
  p_documento VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_movimentacao_id UUID;
BEGIN
  INSERT INTO historico_movimentacao (
    tipo_item, item_id, item_nome, tipo_movimentacao, quantidade,
    estoque_anterior, estoque_novo, responsavel_id, motivo, documento
  ) VALUES (
    p_tipo_item, p_item_id, p_item_nome, p_tipo_movimentacao, p_quantidade,
    p_estoque_anterior, p_estoque_novo, p_responsavel_id, p_motivo, p_documento
  ) RETURNING id INTO v_movimentacao_id;
  
  RETURN v_movimentacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função para criar ajuste de estoque
CREATE OR REPLACE FUNCTION criar_ajuste_estoque(
  p_tipo_item VARCHAR,
  p_item_id UUID,
  p_item_nome VARCHAR,
  p_quantidade_nova DECIMAL,
  p_quantidade_anterior DECIMAL,
  p_motivo TEXT,
  p_responsavel_id UUID
) RETURNS UUID AS $$
DECLARE
  v_ajuste_id UUID;
  v_diferenca DECIMAL;
  v_percentual DECIMAL;
  v_nc_id UUID;
BEGIN
  v_diferenca := p_quantidade_nova - p_quantidade_anterior;
  v_percentual := ABS((v_diferenca / NULLIF(p_quantidade_anterior, 0)) * 100);
  
  -- Criar ajuste
  INSERT INTO ajuste_estoque (
    tipo_item, item_id, item_nome, quantidade_anterior, quantidade_nova,
    diferenca, percentual_diferenca, motivo, responsavel_id
  ) VALUES (
    p_tipo_item, p_item_id, p_item_nome, p_quantidade_anterior, p_quantidade_nova,
    v_diferenca, v_percentual, p_motivo, p_responsavel_id
  ) RETURNING id INTO v_ajuste_id;
  
  -- Se diferença > 10%, gerar NC automaticamente
  IF v_percentual > 10 THEN
    INSERT INTO nao_conformidade (
      titulo,
      descricao,
      tipo,
      severidade,
      status,
      responsavel_id
    ) VALUES (
      'Divergência de Estoque: ' || p_item_nome,
      'Ajuste de estoque com diferença de ' || v_percentual::TEXT || '% detectado. ' ||
      'Quantidade anterior: ' || p_quantidade_anterior || ', Nova: ' || p_quantidade_nova || '. ' ||
      'Motivo: ' || p_motivo,
      'PROCESSO',
      CASE 
        WHEN v_percentual > 50 THEN 'CRITICA'
        WHEN v_percentual > 25 THEN 'ALTA'
        ELSE 'MEDIA'
      END,
      'ABERTA',
      p_responsavel_id
    ) RETURNING id INTO v_nc_id;
    
    -- Vincular NC ao ajuste
    UPDATE ajuste_estoque SET nc_gerada_id = v_nc_id WHERE id = v_ajuste_id;
  END IF;
  
  -- Registrar movimentação
  PERFORM registrar_movimentacao(
    p_tipo_item, p_item_id, p_item_nome, 'AJUSTE', v_diferenca,
    p_quantidade_anterior, p_quantidade_nova, p_responsavel_id, p_motivo, NULL
  );
  
  RETURN v_ajuste_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função para verificar e criar alertas de estoque
CREATE OR REPLACE FUNCTION verificar_alertas_estoque()
RETURNS VOID AS $$
DECLARE
  v_item RECORD;
  v_percentual DECIMAL;
  v_nivel VARCHAR;
BEGIN
  -- Limpar alertas antigos resolvidos (estoque normalizado)
  DELETE FROM alerta_estoque 
  WHERE resolved_at IS NULL 
  AND id NOT IN (
    SELECT a.id FROM alerta_estoque a
    INNER JOIN materia_prima mp ON a.item_id = mp.id AND a.tipo_item = 'MATERIA_PRIMA'
    WHERE mp.estoque_atual < mp.estoque_minimo
    UNION
    SELECT a.id FROM alerta_estoque a
    INNER JOIN produto_acabado pa ON a.item_id = pa.id AND a.tipo_item = 'PRODUTO_ACABADO'
    WHERE pa.estoque_atual < pa.estoque_minimo
  );
  
  -- Verificar Matérias-Primas
  FOR v_item IN 
    SELECT id, nome, estoque_atual, estoque_minimo, 'MATERIA_PRIMA' as tipo
    FROM materia_prima
    WHERE alerta_ativo = TRUE 
    AND estoque_minimo > 0
    AND estoque_atual < estoque_minimo
  LOOP
    v_percentual := (v_item.estoque_atual / NULLIF(v_item.estoque_minimo, 0)) * 100;
    
    v_nivel := CASE
      WHEN v_percentual < 25 THEN 'CRITICO'
      WHEN v_percentual < 50 THEN 'BAIXO'
      ELSE 'NORMAL'
    END;
    
    -- Criar ou atualizar alerta
    INSERT INTO alerta_estoque (
      tipo_item, item_id, item_nome, estoque_atual, estoque_minimo,
      percentual_estoque, nivel_alerta
    ) VALUES (
      v_item.tipo, v_item.id, v_item.nome, v_item.estoque_atual, v_item.estoque_minimo,
      v_percentual, v_nivel
    )
    ON CONFLICT DO NOTHING;
    
    -- Criar notificação se crítico e não notificado
    IF v_nivel = 'CRITICO' THEN
      PERFORM criar_notificacao(
        (SELECT id FROM usuarios WHERE email LIKE '%compras%' LIMIT 1), -- Responsável de compras
        'ESTOQUE_MINIMO',
        '📦 Estoque Crítico: ' || v_item.nome,
        'O estoque está em ' || v_percentual::TEXT || '% do mínimo (' || v_item.estoque_atual || '/' || v_item.estoque_minimo || ')',
        '/estoque/mp',
        'URGENTE',
        jsonb_build_object('item_id', v_item.id, 'tipo', v_item.tipo, 'percentual', v_percentual)
      );
    END IF;
  END LOOP;
  
  -- Verificar Produtos Acabados
  FOR v_item IN 
    SELECT id, nome, estoque_atual, estoque_minimo, 'PRODUTO_ACABADO' as tipo
    FROM produto_acabado
    WHERE alerta_ativo = TRUE 
    AND estoque_minimo > 0
    AND estoque_atual < estoque_minimo
  LOOP
    v_percentual := (v_item.estoque_atual / NULLIF(v_item.estoque_minimo, 0)) * 100;
    
    v_nivel := CASE
      WHEN v_percentual < 25 THEN 'CRITICO'
      WHEN v_percentual < 50 THEN 'BAIXO'
      ELSE 'NORMAL'
    END;
    
    INSERT INTO alerta_estoque (
      tipo_item, item_id, item_nome, estoque_atual, estoque_minimo,
      percentual_estoque, nivel_alerta
    ) VALUES (
      v_item.tipo, v_item.id, v_item.nome, v_item.estoque_atual, v_item.estoque_minimo,
      v_percentual, v_nivel
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para atualizar estoque_atual automaticamente (exemplo para materia_prima)
-- Nota: Este é um exemplo. Em produção, você deve atualizar estoque_atual via lógica de aplicação

COMMENT ON COLUMN materia_prima.estoque_minimo IS 'Quantidade mínima em estoque antes de gerar alerta';
COMMENT ON COLUMN materia_prima.estoque_atual IS 'Quantidade atual em estoque (atualizado via movimentações)';
COMMENT ON COLUMN materia_prima.alerta_ativo IS 'Se TRUE, gera alertas quando estoque < mínimo';

COMMENT ON TABLE historico_movimentacao IS 'Registro de todas as movimentações de estoque (entrada, saída, ajuste, etc)';
COMMENT ON TABLE ajuste_estoque IS 'Ajustes de estoque com justificativa obrigatória. Gera NC se diferença > 10%';
COMMENT ON TABLE alerta_estoque IS 'Alertas ativos de estoque abaixo do mínimo';
