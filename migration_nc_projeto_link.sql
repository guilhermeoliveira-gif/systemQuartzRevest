-- Migração: Adicionar vínculo entre Projeto e Não Conformidade

-- 1. Adicionar coluna nc_origem_id na tabela projeto
ALTER TABLE projeto 
ADD COLUMN IF NOT EXISTS nc_origem_id UUID REFERENCES nao_conformidade(id) ON DELETE SET NULL;

-- 2. Adicionar índice
CREATE INDEX IF NOT EXISTS idx_projeto_nc_origem ON projeto(nc_origem_id);

-- 3. Comentário
COMMENT ON COLUMN projeto.nc_origem_id IS 'ID da Não Conformidade que originou este projeto (se aplicável)';

-- 4. Função para criar projeto a partir de NC
CREATE OR REPLACE FUNCTION criar_projeto_de_nc(
  p_nc_id UUID,
  p_nome VARCHAR,
  p_descricao TEXT,
  p_responsavel_id UUID,
  p_data_inicio DATE DEFAULT CURRENT_DATE,
  p_data_fim_prevista DATE DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_projeto_id UUID;
  v_nc RECORD;
BEGIN
  -- Buscar dados da NC
  SELECT * INTO v_nc FROM nao_conformidade WHERE id = p_nc_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Não Conformidade não encontrada';
  END IF;
  
  -- Criar projeto
  INSERT INTO projeto (
    nome,
    descricao,
    responsavel_id,
    status,
    prioridade,
    data_inicio,
    data_fim_prevista,
    nc_origem_id,
    progresso
  ) VALUES (
    p_nome,
    p_descricao,
    p_responsavel_id,
    'PLANEJAMENTO',
    CASE v_nc.severidade
      WHEN 'CRITICA' THEN 'URGENTE'
      WHEN 'ALTA' THEN 'ALTA'
      WHEN 'MEDIA' THEN 'MEDIA'
      ELSE 'BAIXA'
    END,
    p_data_inicio,
    COALESCE(p_data_fim_prevista, CURRENT_DATE + INTERVAL '30 days'),
    p_nc_id,
    0
  ) RETURNING id INTO v_projeto_id;
  
  -- Criar notificação para o responsável
  PERFORM criar_notificacao(
    p_responsavel_id,
    'PROJETO_ATUALIZADO',
    '📊 Novo Projeto Criado',
    'Projeto "' || p_nome || '" criado a partir da NC: ' || v_nc.titulo,
    '/projetos/dashboard',
    'NORMAL',
    jsonb_build_object('projeto_id', v_projeto_id, 'nc_id', p_nc_id)
  );
  
  RETURN v_projeto_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
