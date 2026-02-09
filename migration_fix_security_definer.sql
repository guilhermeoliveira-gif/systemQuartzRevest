-- Migração: Corrigir SECURITY DEFINER na view tarefas_unificadas
-- Issue: Security Advisor detectou que a view está usando SECURITY DEFINER
-- Solução: Recriar a view sem SECURITY DEFINER (padrão é SECURITY INVOKER)

-- 1. Remover a view existente
DROP VIEW IF EXISTS tarefas_unificadas;

-- 2. Recriar a view SEM SECURITY DEFINER (usa SECURITY INVOKER por padrão)
-- Isso garante que a view execute com as permissões do usuário que está consultando
CREATE VIEW tarefas_unificadas 
WITH (security_invoker = true) -- Explicitamente definir SECURITY INVOKER
AS
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

-- 3. Garantir que as políticas RLS estão ativas nas tabelas base
-- A view agora respeitará as RLS policies das tabelas tarefa e tarefa_projeto

-- Verificar se RLS está habilitado
ALTER TABLE tarefa ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefa_projeto ENABLE ROW LEVEL SECURITY;

-- 4. Comentário explicativo
COMMENT ON VIEW tarefas_unificadas IS 'View unificada de tarefas (Planos de Ação + Projetos). Usa SECURITY INVOKER para respeitar RLS do usuário consultante.';
