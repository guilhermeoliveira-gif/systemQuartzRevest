-- Schema para Autenticação e Perfis de Usuário

-- 1. Tabela de Perfis de Usuário (vinculada ao auth.users)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nome TEXT,
  cargo TEXT,
  setor TEXT, -- 'QUALIDADE', 'ESTOQUE', 'ADMIN'
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (RLS)
-- Todos podem ver perfis básicos (nome, email, cargo)
CREATE POLICY "Perfis visíveis para todos autenticados" 
ON public.usuarios FOR SELECT 
TO authenticated 
USING (true);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Usuários podem editar seu próprio perfil" 
ON public.usuarios FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

-- 4. Trigger para criar perfil automaticamente ao registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove a trigger se ela já existir para evitar duplicidade ou erro na criação
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
