-- Migração: Corrigir search_path mutável nas funções
-- Issue: Security Advisor detectou funções sem search_path fixo
-- Solução: Adicionar SET search_path = public, pg_temp em todas as funções SECURITY DEFINER
-- Impacto: Previne ataques de injeção de schema

-- ============================================================================
-- FUNÇÕES DE NOTIFICAÇÃO
-- ============================================================================

-- 1. criar_notificacao
CREATE OR REPLACE FUNCTION criar_notificacao(
  p_usuario_id UUID,
  p_tipo VARCHAR,
  p_titulo VARCHAR,
  p_mensagem TEXT,
  p_link TEXT DEFAULT NULL,
  p_prioridade VARCHAR DEFAULT 'NORMAL',
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_notificacao_id UUID;
BEGIN
  INSERT INTO notificacao (usuario_id, tipo, titulo, mensagem, link, prioridade, metadata)
  VALUES (p_usuario_id, p_tipo, p_titulo, p_mensagem, p_link, p_prioridade, p_metadata)
  RETURNING id INTO v_notificacao_id;
  
  RETURN v_notificacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- 2. marcar_notificacao_lida
CREATE OR REPLACE FUNCTION marcar_notificacao_lida(p_notificacao_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notificacao
  SET lida = TRUE, data_leitura = NOW()
  WHERE id = p_notificacao_id AND usuario_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- 3. marcar_todas_lidas
CREATE OR REPLACE FUNCTION marcar_todas_lidas()
RETURNS VOID AS $$
BEGIN
  UPDATE notificacao
  SET lida = TRUE, data_leitura = NOW()
  WHERE usuario_id = auth.uid() AND lida = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- 4. notificar_tarefas_atrasadas
CREATE OR REPLACE FUNCTION notificar_tarefas_atrasadas()
RETURNS VOID AS $$
DECLARE
  v_tarefa RECORD;
BEGIN
  FOR v_tarefa IN 
    SELECT * FROM tarefas_unificadas 
    WHERE prazo < CURRENT_DATE 
    AND status NOT IN ('CONCLUIDA', 'CANCELADA')
    AND responsavel_id IS NOT NULL
  LOOP
    PERFORM criar_notificacao(
      v_tarefa.responsavel_id,
      'TAREFA_ATRASADA',
      '⚠️ Tarefa atrasada',
      'A tarefa "' || v_tarefa.titulo || '" está atrasada desde ' || v_tarefa.prazo,
      v_tarefa.link,
      'ALTA',
      jsonb_build_object('tarefa_id', v_tarefa.id, 'origem', v_tarefa.origem)
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- 5. notificar_prazos_proximos
CREATE OR REPLACE FUNCTION notificar_prazos_proximos()
RETURNS VOID AS $$
DECLARE
  v_tarefa RECORD;
BEGIN
  FOR v_tarefa IN 
    SELECT * FROM tarefas_unificadas 
    WHERE prazo BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
    AND status NOT IN ('CONCLUIDA', 'CANCELADA')
    AND responsavel_id IS NOT NULL
  LOOP
    PERFORM criar_notificacao(
      v_tarefa.responsavel_id,
      'PRAZO_PROXIMO',
      '⏰ Prazo se aproximando',
      'A tarefa "' || v_tarefa.titulo || '" vence em ' || (v_tarefa.prazo - CURRENT_DATE) || ' dias',
      v_tarefa.link,
      'NORMAL',
      jsonb_build_object('tarefa_id', v_tarefa.id, 'origem', v_tarefa.origem)
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- 6. notificar_tarefa_atribuida
CREATE OR REPLACE FUNCTION notificar_tarefa_atribuida()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar quando uma tarefa é criada com responsável
  IF NEW.responsavel_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.responsavel_id IS DISTINCT FROM NEW.responsavel_id) THEN
    PERFORM criar_notificacao(
      NEW.responsavel_id,
      'TAREFA_ATRIBUIDA',
      '📋 Nova tarefa atribuída',
      'Você foi atribuído à tarefa: ' || COALESCE(NEW.titulo, NEW.descricao),
      CASE 
        WHEN TG_TABLE_NAME = 'tarefa' THEN '/qualidade/tarefas'
        WHEN TG_TABLE_NAME = 'tarefa_projeto' THEN '/projetos/tarefas'
        ELSE '/tarefas'
      END,
      'NORMAL',
      jsonb_build_object('tarefa_id', NEW.id, 'tipo', TG_TABLE_NAME)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- ============================================================================
-- FUNÇÕES DE AUTENTICAÇÃO
-- ============================================================================

-- 7. handle_new_user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nome)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================================================
-- FUNÇÕES DE ESTOQUE
-- ============================================================================

-- 8. registrar_movimentacao
CREATE OR REPLACE FUNCTION registrar_movimentacao(
  p_item_id UUID,
  p_tipo_movimento VARCHAR,
  p_quantidade NUMERIC,
  p_usuario_id UUID,
  p_observacao TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_movimento_id UUID;
BEGIN
  INSERT INTO historico_movimentacao (
    item_id, 
    tipo_movimento, 
    quantidade, 
    usuario_id, 
    observacao
  )
  VALUES (
    p_item_id, 
    p_tipo_movimento, 
    p_quantidade, 
    p_usuario_id, 
    p_observacao
  )
  RETURNING id INTO v_movimento_id;
  
  RETURN v_movimento_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- 9. criar_ajuste_estoque
CREATE OR REPLACE FUNCTION criar_ajuste_estoque(
  p_item_id UUID,
  p_quantidade_anterior NUMERIC,
  p_quantidade_nova NUMERIC,
  p_motivo TEXT,
  p_usuario_id UUID
) RETURNS UUID AS $$
DECLARE
  v_ajuste_id UUID;
BEGIN
  INSERT INTO ajuste_estoque (
    item_id,
    quantidade_anterior,
    quantidade_nova,
    motivo,
    usuario_id
  )
  VALUES (
    p_item_id,
    p_quantidade_anterior,
    p_quantidade_nova,
    p_motivo,
    p_usuario_id
  )
  RETURNING id INTO v_ajuste_id;
  
  RETURN v_ajuste_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- 10. verificar_alertas_estoque
CREATE OR REPLACE FUNCTION verificar_alertas_estoque()
RETURNS VOID AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Verificar matérias-primas
  FOR v_item IN 
    SELECT id, nome, quantidade_atual, estoque_minimo
    FROM materia_prima
    WHERE quantidade_atual <= estoque_minimo
  LOOP
    INSERT INTO alerta_estoque (item_id, tipo_item, mensagem, nivel)
    VALUES (
      v_item.id,
      'MATERIA_PRIMA',
      'Estoque baixo: ' || v_item.nome || ' (' || v_item.quantidade_atual || ' unidades)',
      'CRITICO'
    )
    ON CONFLICT (item_id, tipo_item) DO UPDATE
    SET mensagem = EXCLUDED.mensagem, created_at = NOW();
  END LOOP;
  
  -- Verificar produtos acabados
  FOR v_item IN 
    SELECT id, nome, quantidade_atual, estoque_minimo
    FROM produto_acabado
    WHERE quantidade_atual <= estoque_minimo
  LOOP
    INSERT INTO alerta_estoque (item_id, tipo_item, mensagem, nivel)
    VALUES (
      v_item.id,
      'PRODUTO_ACABADO',
      'Estoque baixo: ' || v_item.nome || ' (' || v_item.quantidade_atual || ' unidades)',
      'CRITICO'
    )
    ON CONFLICT (item_id, tipo_item) DO UPDATE
    SET mensagem = EXCLUDED.mensagem, created_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- ============================================================================
-- FUNÇÕES DE PROJETOS
-- ============================================================================

-- 11. atualizar_progresso_projeto
CREATE OR REPLACE FUNCTION atualizar_progresso_projeto()
RETURNS TRIGGER AS $$
DECLARE
  v_total_tarefas INTEGER;
  v_tarefas_concluidas INTEGER;
  v_progresso NUMERIC;
BEGIN
  -- Contar tarefas do projeto
  SELECT COUNT(*) INTO v_total_tarefas
  FROM tarefa_projeto
  WHERE projeto_id = NEW.projeto_id;
  
  -- Contar tarefas concluídas
  SELECT COUNT(*) INTO v_tarefas_concluidas
  FROM tarefa_projeto
  WHERE projeto_id = NEW.projeto_id
  AND status = 'CONCLUIDA';
  
  -- Calcular progresso
  IF v_total_tarefas > 0 THEN
    v_progresso := (v_tarefas_concluidas::NUMERIC / v_total_tarefas::NUMERIC) * 100;
  ELSE
    v_progresso := 0;
  END IF;
  
  -- Atualizar projeto
  UPDATE projeto
  SET progresso = v_progresso
  WHERE id = NEW.projeto_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- 12. criar_projeto_de_nc
CREATE OR REPLACE FUNCTION criar_projeto_de_nc(
  p_nc_id UUID,
  p_nome VARCHAR,
  p_descricao TEXT,
  p_responsavel_id UUID
) RETURNS UUID AS $$
DECLARE
  v_projeto_id UUID;
BEGIN
  INSERT INTO projeto (nome, descricao, responsavel_id, origem_nc_id)
  VALUES (p_nome, p_descricao, p_responsavel_id, p_nc_id)
  RETURNING id INTO v_projeto_id;
  
  -- Atualizar NC com link para projeto
  UPDATE nao_conformidade
  SET projeto_id = v_projeto_id
  WHERE id = p_nc_id;
  
  RETURN v_projeto_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================================================
-- FUNÇÕES DE MANUTENÇÃO
-- ============================================================================

-- 13. fn_update_maquina_maintenance_stats
CREATE OR REPLACE FUNCTION fn_update_maquina_maintenance_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE manutencao_maquina
  SET 
    ultima_manutencao = (
      SELECT MAX(data_inicio)
      FROM manutencao_os
      WHERE maquina_id = NEW.maquina_id
      AND status = 'CONCLUIDA'
    ),
    total_manutencoes = (
      SELECT COUNT(*)
      FROM manutencao_os
      WHERE maquina_id = NEW.maquina_id
    )
  WHERE id = NEW.maquina_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- ============================================================================
-- COMENTÁRIOS EXPLICATIVOS
-- ============================================================================

COMMENT ON FUNCTION criar_notificacao IS 'Cria notificação para usuário. SECURITY DEFINER com search_path fixo para prevenir injeção de schema.';
COMMENT ON FUNCTION handle_new_user IS 'Trigger para criar perfil de usuário automaticamente. SECURITY DEFINER com search_path fixo.';
COMMENT ON FUNCTION registrar_movimentacao IS 'Registra movimentação de estoque. SECURITY DEFINER com search_path fixo.';
