-- Migração: Adicionar responsavel_id às tabelas de tarefas

-- 1. Adicionar coluna responsavel_id na tabela tarefa (Qualidade)
ALTER TABLE tarefa ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES usuarios(id);
ALTER TABLE tarefa ADD COLUMN IF NOT EXISTS titulo VARCHAR(255);
ALTER TABLE tarefa ADD COLUMN IF NOT EXISTS prioridade VARCHAR(50) DEFAULT 'MEDIA' CHECK (prioridade IN ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE'));
ALTER TABLE tarefa ADD COLUMN IF NOT EXISTS data_fim_prevista DATE;

-- Migrar dados existentes (responsavel VARCHAR -> responsavel_id UUID)
-- Nota: Como responsavel é VARCHAR (nome), não podemos migrar automaticamente
-- Novos registros devem usar responsavel_id

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_tarefa_responsavel ON tarefa(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_tarefa_status ON tarefa(status);
CREATE INDEX IF NOT EXISTS idx_tarefa_prazo ON tarefa(prazo);

-- 3. Atualizar view tarefas_unificadas para lidar com ambos os campos
DROP VIEW IF EXISTS tarefas_unificadas;

CREATE OR REPLACE VIEW tarefas_unificadas AS
SELECT 
  t.id,
  'PLANO_ACAO' as origem,
  COALESCE(t.titulo, t.descricao) as titulo,
  t.descricao,
  t.responsavel_id,
  COALESCE(t.data_fim_prevista, t.prazo::date) as prazo,
  t.status,
  COALESCE(t.prioridade, 'MEDIA') as prioridade,
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

-- 4. Atualizar trigger para funcionar com responsavel_id
DROP TRIGGER IF EXISTS trigger_notificar_tarefa_plano ON tarefa;

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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notificar_tarefa_plano
  AFTER INSERT OR UPDATE OF responsavel_id ON tarefa
  FOR EACH ROW
  EXECUTE FUNCTION notificar_tarefa_atribuida();

CREATE TRIGGER trigger_notificar_tarefa_projeto
  AFTER INSERT OR UPDATE OF responsavel_id ON tarefa_projeto
  FOR EACH ROW
  EXECUTE FUNCTION notificar_tarefa_atribuida();

-- 5. Comentários explicativos
COMMENT ON COLUMN tarefa.responsavel IS 'DEPRECATED: Use responsavel_id (UUID) ao invés de responsavel (VARCHAR)';
COMMENT ON COLUMN tarefa.responsavel_id IS 'ID do usuário responsável pela tarefa (FK para usuarios.id)';
