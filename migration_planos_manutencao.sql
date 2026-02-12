-- Tabelas para Planos de Manutenção Preventiva

-- 1. Cabeçalho do Plano
CREATE TABLE IF NOT EXISTS manutencao_plano (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT,
    nome TEXT NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Itens do Plano (Roteiro)
CREATE TABLE IF NOT EXISTS manutencao_plano_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plano_id UUID REFERENCES manutencao_plano(id) ON DELETE CASCADE,
    tarefa TEXT NOT NULL,
    descricao_detalhada TEXT,
    periodicidade_horas INTEGER, -- Ex: 250h
    periodicidade_dias INTEGER,  -- Ex: 30 dias
    pecas_sugeridas JSONB DEFAULT '[]', -- Sugestão de peças do kit
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Vínculo Máquina <-> Plano
CREATE TABLE IF NOT EXISTS manutencao_maquina_plano (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maquina_id UUID REFERENCES manutencao_maquina(id) ON DELETE CASCADE,
    plano_id UUID REFERENCES manutencao_plano(id) ON DELETE CASCADE,
    ultima_execucao_data DATE,
    ultima_execucao_horas INTEGER,
    status_vencimento TEXT DEFAULT 'OK', -- OK, ALERTA, CRITICO
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(maquina_id, plano_id)
);

-- Habilitar RLS
ALTER TABLE manutencao_plano ENABLE ROW LEVEL SECURITY;
ALTER TABLE manutencao_plano_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE manutencao_maquina_plano ENABLE ROW LEVEL SECURITY;

-- Políticas Básicas (Acesso total para autenticados do mesmo org - simplificado)
CREATE POLICY "Acesso total Planos" ON manutencao_plano FOR ALL USING (true);
CREATE POLICY "Acesso total Plano Itens" ON manutencao_plano_item FOR ALL USING (true);
CREATE POLICY "Acesso total Maquina Vinculo" ON manutencao_maquina_plano FOR ALL USING (true);
