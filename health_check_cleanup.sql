-- 1. Matar APENAS conexões 'idle' do SEU USUÁRIO ATUAL
-- Isso evita o erro de permissão (42501)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
AND pid <> pg_backend_pid()
AND usename = current_user; -- Só mata processos do mesmo usuário logado

-- 2. Listar as maiores tabelas novamente (Isso não precisa de permissão admin)
SELECT
  schemaname as table_schema,
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;
