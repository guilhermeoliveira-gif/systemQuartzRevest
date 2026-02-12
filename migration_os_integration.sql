-- Migração para integração de OS, Problemas e Tarefas

-- 1. Adicionar novos campos na tabela de OS
ALTER TABLE manutencao_os
ADD COLUMN tipo_os text CHECK (tipo_os IN ('Corretiva', 'Preventiva', 'Preditiva', 'Problema', 'Tarefa', 'Manutencao Preventiva')),
ADD COLUMN nc_id uuid REFERENCES nao_conformidade(id),
ADD COLUMN tarefa_id uuid REFERENCES tarefa_projeto(id);

-- 2. Alterar maquina_id para ser opcional
ALTER TABLE manutencao_os
ALTER COLUMN maquina_id DROP NOT NULL;

-- 3. Adicionar índices para performance nos relacionamentos
CREATE INDEX IF NOT EXISTS idx_manutencao_os_nc_id ON manutencao_os(nc_id);
CREATE INDEX IF NOT EXISTS idx_manutencao_os_tarefa_id ON manutencao_os(tarefa_id);

-- 4. Função para verificar e gerar manutenção preventiva automática
CREATE OR REPLACE FUNCTION check_manutencao_preventiva()
RETURNS TRIGGER AS $$
DECLARE
    nova_os_id uuid;
BEGIN
    -- Verifica se a máquina atingiu o intervalo de manutenção e se não há OS aberta
    IF (NEW.horas_uso_total >= (NEW.ultima_manutencao_horas + NEW.intervalo_manutencao_horas)) AND 
       NOT EXISTS (
           SELECT 1 FROM manutencao_os 
           WHERE maquina_id = NEW.id 
           AND status NOT IN ('Concluída', 'Cancelada')
           AND tipo_os = 'Manutencao Preventiva'
       ) THEN
        
        -- Gerar OS Automática
        INSERT INTO manutencao_os (
            maquina_id, 
            tipo, 
            tipo_os,
            status, 
            prioridade, 
            descricao, 
            data_abertura
        ) VALUES (
            NEW.id,
            'Preventiva',
            'Manutencao Preventiva',
            'Aberta',
            'Alta',
            'Manutenção Preventiva Automática - Intervalo de horas atingido (' || NEW.horas_uso_total || 'h)',
            NOW()
        ) RETURNING id INTO nova_os_id;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger na tabela de máquinas
DROP TRIGGER IF EXISTS trigger_check_manutencao_preventiva ON manutencao_maquina;
CREATE TRIGGER trigger_check_manutencao_preventiva
AFTER UPDATE OF horas_uso_total ON manutencao_maquina
FOR EACH ROW
EXECUTE FUNCTION check_manutencao_preventiva();
