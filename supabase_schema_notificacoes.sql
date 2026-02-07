-- Schema para Sistema de Notificações Global

-- 1. Tabela de Notificações
CREATE TABLE IF NOT EXISTS notificacao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('TAREFA_ATRIBUIDA', 'TAREFA_ATRASADA', 'PRAZO_PROXIMO', 'NC_CRIADA', 'PROJETO_ATUALIZADO', 'ESTOQUE_MINIMO', 'SISTEMA')),
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  link TEXT, -- URL para navegar quando clicar
  lida BOOLEAN DEFAULT FALSE,
  data_leitura TIMESTAMPTZ,
  prioridade VARCHAR(20) DEFAULT 'NORMAL' CHECK (prioridade IN ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE')),
  metadata JSONB DEFAULT '{}'::jsonb, -- Dados extras (id da tarefa, projeto, etc)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Preferências de Notificação por Usuário
CREATE TABLE IF NOT EXISTS preferencia_notificacao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_tarefa_atribuida BOOLEAN DEFAULT TRUE,
  email_tarefa_atrasada BOOLEAN DEFAULT TRUE,
  email_prazo_proximo BOOLEAN DEFAULT TRUE,
  email_estoque_minimo BOOLEAN DEFAULT TRUE,
  push_tarefa_atribuida BOOLEAN DEFAULT TRUE,
  push_tarefa_atrasada BOOLEAN DEFAULT TRUE,
  push_prazo_proximo BOOLEAN DEFAULT TRUE,
  horario_resumo_diario TIME DEFAULT '08:00:00',
  enviar_resumo_diario BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferencia_notificacao ENABLE ROW LEVEL SECURITY;

-- Policies - Usuário só vê suas próprias notificações
CREATE POLICY "Usuários veem apenas suas notificações" 
ON notificacao FOR SELECT 
TO authenticated 
USING (usuario_id = auth.uid());

CREATE POLICY "Usuários podem marcar como lida" 
ON notificacao FOR UPDATE 
TO authenticated
USING (usuario_id = auth.uid());

CREATE POLICY "Usuários veem apenas suas preferências" 
ON preferencia_notificacao FOR ALL 
TO authenticated 
USING (usuario_id = auth.uid());

-- Indexes
CREATE INDEX idx_notificacao_usuario ON notificacao(usuario_id);
CREATE INDEX idx_notificacao_lida ON notificacao(lida);
CREATE INDEX idx_notificacao_created ON notificacao(created_at DESC);

-- Função para criar notificação
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar notificação como lida
CREATE OR REPLACE FUNCTION marcar_notificacao_lida(p_notificacao_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notificacao
  SET lida = TRUE, data_leitura = NOW()
  WHERE id = p_notificacao_id AND usuario_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar todas como lidas
CREATE OR REPLACE FUNCTION marcar_todas_lidas()
RETURNS VOID AS $$
BEGIN
  UPDATE notificacao
  SET lida = TRUE, data_leitura = NOW()
  WHERE usuario_id = auth.uid() AND lida = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificar quando tarefa é atribuída
CREATE OR REPLACE FUNCTION notificar_tarefa_atribuida()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar quando uma tarefa é criada com responsável
  IF NEW.responsavel_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.responsavel_id IS DISTINCT FROM NEW.responsavel_id) THEN
    PERFORM criar_notificacao(
      NEW.responsavel_id,
      'TAREFA_ATRIBUIDA',
      '📋 Nova tarefa atribuída',
      'Você foi atribuído à tarefa: ' || NEW.titulo,
      '/qualidade/tarefas',
      'NORMAL',
      jsonb_build_object('tarefa_id', NEW.id, 'tipo', 'plano_acao')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em tarefas de plano de ação
DROP TRIGGER IF EXISTS trigger_notificar_tarefa_plano ON tarefa;
CREATE TRIGGER trigger_notificar_tarefa_plano
  AFTER INSERT OR UPDATE OF responsavel_id ON tarefa
  FOR EACH ROW
  EXECUTE FUNCTION notificar_tarefa_atribuida();

-- Aplicar trigger em tarefas de projeto
DROP TRIGGER IF EXISTS trigger_notificar_tarefa_projeto ON tarefa_projeto;
CREATE TRIGGER trigger_notificar_tarefa_projeto
  AFTER INSERT OR UPDATE OF responsavel_id ON tarefa_projeto
  FOR EACH ROW
  EXECUTE FUNCTION notificar_tarefa_atribuida();

-- View para tarefas unificadas (todas as fontes)
CREATE OR REPLACE VIEW tarefas_unificadas AS
SELECT 
  t.id,
  'PLANO_ACAO' as origem,
  t.titulo,
  t.descricao,
  t.responsavel_id,
  t.data_fim_prevista as prazo,
  t.status,
  t.prioridade,
  pa.titulo as contexto,
  '/qualidade/tarefas' as link,
  t.created_at
FROM tarefa t
LEFT JOIN plano_acao pa ON t.plano_acao_id = pa.id

UNION ALL

SELECT 
  tp.id,
  'PROJETO' as origem,
  tp.titulo,
  tp.descricao,
  tp.responsavel_id,
  tp.data_fim_prevista as prazo,
  tp.status,
  tp.prioridade,
  p.nome as contexto,
  '/projetos/tarefas' as link,
  tp.created_at
FROM tarefa_projeto tp
LEFT JOIN projeto p ON tp.projeto_id = p.id;

-- Função para verificar tarefas atrasadas (executar diariamente via cron)
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
$$ LANGUAGE plpgsql;

-- Função para notificar prazos próximos (3 dias antes)
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
$$ LANGUAGE plpgsql;
