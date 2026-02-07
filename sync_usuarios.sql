-- Script para sincronizar usuários existentes do Auth com a tabela usuarios

-- Inserir usuários do auth.users que não existem na tabela usuarios
INSERT INTO usuarios (id, email, nome, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'nome', au.email) as nome,
    au.created_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios u WHERE u.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Verificar quantos usuários foram sincronizados
SELECT 
    'Total de usuários no Auth' as tipo,
    COUNT(*) as quantidade
FROM auth.users
UNION ALL
SELECT 
    'Total de usuários na tabela usuarios' as tipo,
    COUNT(*) as quantidade
FROM usuarios;
