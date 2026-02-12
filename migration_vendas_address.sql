-- Adicionar coluna de endereço de entrega no pedido
ALTER TABLE vendas_pedido 
ADD COLUMN IF NOT EXISTS endereco_entrega TEXT;
