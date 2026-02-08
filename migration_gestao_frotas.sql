-- Tabela de Veículos
CREATE TABLE IF NOT EXISTS frota_veiculos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placa VARCHAR(20) NOT NULL UNIQUE,
    marca VARCHAR(50),
    modelo VARCHAR(50) NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('CARRO', 'MOTO', 'TOCO', 'TRUCK', 'CAVALO', 'CARRETA', 'OUTRO')),
    ano INTEGER,
    km_atual INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'MANUTENÇÃO', 'INATIVO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabela de Abastecimentos
CREATE TABLE IF NOT EXISTS frota_abastecimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    veiculo_id UUID REFERENCES frota_veiculos(id) ON DELETE CASCADE,
    data TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    km INTEGER NOT NULL,
    litros NUMERIC(10, 2) NOT NULL,
    valor_total NUMERIC(10, 2),
    posto VARCHAR(100),
    media_km_l NUMERIC(10, 2), -- Calculado no frontend/backend na inserção
    usuario_id UUID, -- Opcional, caso queira rastrear quem inseriu
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabela de Manutenções da Frota
CREATE TABLE IF NOT EXISTS frota_manutencoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    veiculo_id UUID REFERENCES frota_veiculos(id) ON DELETE CASCADE,
    data TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    km INTEGER NOT NULL,
    tipo_manutencao VARCHAR(50) CHECK (tipo_manutencao IN ('PREVENTIVA', 'CORRETIVA', 'PREDITIVA')),
    descricao TEXT NOT NULL,
    custo NUMERIC(10, 2) DEFAULT 0,
    oficina VARCHAR(100),
    usuario_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabela de Outros Serviços (Lavagem, Calibragem, etc)
CREATE TABLE IF NOT EXISTS frota_servicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    veiculo_id UUID REFERENCES frota_veiculos(id) ON DELETE CASCADE,
    data TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    km INTEGER NOT NULL,
    tipo_servico VARCHAR(50) CHECK (tipo_servico IN ('LAVAGEM', 'CALIBRAGEM', 'PNEUS', 'OUTROS')),
    custo NUMERIC(10, 2) DEFAULT 0,
    observacoes TEXT,
    usuario_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_abastecimento_veiculo ON frota_abastecimentos(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_manutencao_veiculo ON frota_manutencoes(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_servico_veiculo ON frota_servicos(veiculo_id);

-- Policies (RLS) - Permite tudo para autenticados (simplificado como o resto do sistema)
ALTER TABLE frota_veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE frota_abastecimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE frota_manutencoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE frota_servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total a veiculos para autenticados" ON frota_veiculos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total a abastecimentos para autenticados" ON frota_abastecimentos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total a manutencoes frota para autenticados" ON frota_manutencoes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total a servicos frota para autenticados" ON frota_servicos FOR ALL USING (auth.role() = 'authenticated');
