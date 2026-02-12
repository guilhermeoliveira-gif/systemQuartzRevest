# PRD: Plano de Manutenção Preventiva Periódica

## Objetivo
Permitir que o gestor de manutenção configure roteiros de revisão para as máquinas, com periodicidade baseada em **dias (calendário)** ou **horas (uso/horímetro)**, garantindo que as Ordens de Serviço (OS) sejam geradas no momento correto.

## User Persona
- **Gestor de Manutenção**: Precisa visualizar o que vencerá no mês e garantir a disponibilidade das máquinas.
- **Técnico**: Precisa de uma lista clara de itens a serem revisados.

## Especificações Técnicas

### 1. Modelo de Dados (Novas Tabelas)
- `manutencao_plano`: Cabeçalho do plano (ex: "Revisão 500h - Escavadeira").
- `manutencao_plano_item`: Itens específicos do plano (ex: "Trocar Óleo", "Verificar Filtros").
- `manutencao_maquina_plano`: Vinculação de máquinas a planos específicos.

### 2. Lógica de Periodicidade
- **Horas**: Trigger baseado na diferença entre `horas_uso_total` e `ultima_manutencao_horas`.
- **Dias**: Trigger baseado na data da última revisão + intervalo de dias.

### 3. Funcionalidades de UI
- [ ] **Configuração de Planos**: Tela para criar templates de manutenção.
- [ ] **Calendário/Previsão**: Visualização em lista/cards das preventivas do mês atual.
- [ ] **Geração de OS**: Botão para "Abrir OS do Mês" para todas as máquinas cujos planos vencem no período.

## Próximos Passos
1. Criar Migration SQL para as novas tabelas.
2. Atualizar `manutencaoService.ts` com métodos para Planos.
3. Desenvolver UI de Configuração e Dashboard de Preventivas.
