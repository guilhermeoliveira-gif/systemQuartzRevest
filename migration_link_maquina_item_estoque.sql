-- Adiciona referência de Peça de Estoque ao Item de Manutenção
ALTER TABLE manutencao_maquina_item
ADD COLUMN IF NOT EXISTS peca_estoque_id UUID REFERENCES mecanica_insumo(id);

-- Opcional: Index para performance em joins futuros
CREATE INDEX IF NOT EXISTS idx_maquina_item_peca ON manutencao_maquina_item(peca_estoque_id);
