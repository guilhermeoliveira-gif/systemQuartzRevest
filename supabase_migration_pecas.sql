-- Migração para adicionar suporte a fotos e identificação na retirada de peças
-- Executar no Editor SQL do Supabase

-- 1. Adicionar campos na tabela movimento_peca
ALTER TABLE public.movimento_peca 
ADD COLUMN IF NOT EXISTS nome_retirante TEXT,
ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- 2. Criar bucket para armazenamento de fotos se não existir
-- Nota: A criação de buckets via SQL requer a extensão 'storage'
INSERT INTO storage.buckets (id, name, public)
SELECT 'pecas-movimentacao', 'pecas-movimentacao', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'pecas-movimentacao'
);

-- 3. Políticas de RLS para o Storage (Permitir upload e leitura pública)
CREATE POLICY "Permitir upload de fotos de movimentação para todos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'pecas-movimentacao');

CREATE POLICY "Permitir visualização pública de fotos de movimentação" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'pecas-movimentacao');
