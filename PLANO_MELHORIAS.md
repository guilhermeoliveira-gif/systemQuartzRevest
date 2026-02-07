# 🚀 PLANO DE IMPLEMENTAÇÃO - QuartzRevest Melhorias

## 📋 RESUMO EXECUTIVO

**Objetivo:** Implementar 13 melhorias críticas no sistema QuartzRevest  
**Prazo Estimado:** 6-8 semanas (1,5-2 meses)  
**Esforço Total:** ~120-150 horas de desenvolvimento  
**Prioridade:** P0 (Crítico para produção)

---

## 🎯 FEATURES SOLICITADAS

### **GRUPO 1: Sistema de Notificações** (Base)
1. ✅ Notificações de tarefas atrasadas
2. ✅ Lembretes de prazos próximos  
3. ✅ Notificação quando alguém te atribui uma tarefa

### **GRUPO 2: Melhorias de Estoque**
4. ⏳ Alertas de estoque mínimo
5. ⏳ Histórico de movimentações
6. ⏳ Ajustes automáticos com justificativa
7. ⏳ Gerar NC automaticamente (estoque)

### **GRUPO 3: Integrações entre Módulos**
8. ⏳ Criar projeto a partir de uma NC
9. ⏳ Unificar "Minhas Tarefas" (Qualidade + Projetos + Estoque)
10. ⏳ Dashboard global mostrando tarefas de todos os módulos

### **GRUPO 4: UX e Busca**
11. ⏳ Barra de busca global (Ctrl+K)
12. ⏳ Busca em: NCs, Projetos, Tarefas, Materiais, Usuários
13. ⏳ Polimento geral de UX

---

## 📅 ROADMAP DETALHADO

### **SPRINT 1 (Semana 1-2): Infraestrutura de Notificações**
**Objetivo:** Sistema de notificações funcionando end-to-end

#### Tarefas:
- [x] Schema SQL (notificacao, preferencia_notificacao) ✅ **CONCLUÍDO**
- [x] Types TypeScript ✅ **CONCLUÍDO**
- [ ] Service layer (notificacoesService.ts)
- [ ] Componente NotificationBell (sino no header)
- [ ] Componente NotificationPanel (dropdown)
- [ ] Triggers automáticos (tarefa atribuída, atrasada, prazo próximo)
- [ ] Testes de integração

**Entregáveis:**
- Sino de notificações no header com badge de contagem
- Painel dropdown mostrando últimas 10 notificações
- Marcar como lida / Marcar todas como lidas
- Link direto para o item relacionado

**Esforço:** 16-20 horas

---

### **SPRINT 2 (Semana 3): Tarefas Unificadas**
**Objetivo:** Página "Minhas Tarefas" mostra TODAS as tarefas do usuário

#### Tarefas:
- [x] View SQL `tarefas_unificadas` ✅ **CONCLUÍDO**
- [ ] Atualizar MinhasTarefas.tsx para usar view unificada
- [ ] Filtros por origem (Qualidade, Projetos, Estoque)
- [ ] Filtros por status e prioridade
- [ ] Ação rápida: Marcar como concluída
- [ ] Contador de tarefas no menu lateral

**Entregáveis:**
- Página única mostrando tarefas de todos os módulos
- Filtros funcionais
- Badge de contagem no menu

**Esforço:** 8-12 horas

---

### **SPRINT 3 (Semana 4): Busca Global**
**Objetivo:** Ctrl+K abre busca que encontra qualquer coisa no sistema

#### Tarefas:
- [ ] Componente GlobalSearch (modal)
- [ ] Atalho de teclado (Ctrl+K / Cmd+K)
- [ ] API de busca (função SQL full-text search)
- [ ] Busca em: NCs, Projetos, Tarefas, Materiais, Usuários
- [ ] Resultados agrupados por tipo
- [ ] Navegação por teclado (↑↓ Enter)
- [ ] Highlight de termos encontrados

**Entregáveis:**
- Barra de busca global acessível de qualquer tela
- Resultados instantâneos (< 200ms)
- Navegação rápida para o item

**Esforço:** 12-16 horas

---

### **SPRINT 4 (Semana 5): Melhorias de Estoque - Parte 1**
**Objetivo:** Controle de estoque mínimo e alertas

#### Tarefas:
- [ ] Adicionar campo `estoque_minimo` nas tabelas (mp, pa, pecas)
- [ ] Adicionar campo `estoque_atual` (calculado ou real)
- [ ] Função SQL para detectar itens abaixo do mínimo
- [ ] Notificação automática quando estoque < mínimo
- [ ] Dashboard: Card "Itens em Alerta" (vermelho)
- [ ] Página de configuração de estoque mínimo

**Entregáveis:**
- Alertas automáticos de estoque crítico
- Dashboard mostra itens em alerta
- Notificação para responsável de compras

**Esforço:** 10-14 horas

---

### **SPRINT 5 (Semana 6): Melhorias de Estoque - Parte 2**
**Objetivo:** Histórico e ajustes com rastreabilidade

#### Tarefas:
- [ ] Tabela `historico_movimentacao` (entrada, saída, ajuste, transferência)
- [ ] Tabela `ajuste_estoque` (motivo, responsável, antes/depois)
- [ ] Trigger para registrar todas as movimentações
- [ ] Página "Histórico de Movimentações" (filtros por item, período, tipo)
- [ ] Função "Ajustar Estoque" com justificativa obrigatória
- [ ] Gerar NC automaticamente se ajuste > 10% do estoque

**Entregáveis:**
- Rastreabilidade completa de movimentações
- Ajustes controlados com justificativa
- NC automática para grandes divergências

**Esforço:** 14-18 horas

---

### **SPRINT 6 (Semana 7): Integrações entre Módulos**
**Objetivo:** Conectar NC → Projeto e Dashboard Global

#### Tarefas:
- [ ] Botão "Gerar Projeto" na tela de NC
- [ ] Modal para criar projeto vinculado à NC
- [ ] Campo `nc_origem_id` na tabela `projeto`
- [ ] Dashboard global unificado (home após login)
- [ ] KPIs globais (NCs abertas, Projetos ativos, Tarefas pendentes, Estoque crítico)
- [ ] Gráfico de tendência (últimos 30 dias)
- [ ] Top 5 ações prioritárias do usuário

**Entregáveis:**
- Fluxo NC → Projeto funcionando
- Dashboard executivo com visão 360°

**Esforço:** 16-20 horas

---

### **SPRINT 7 (Semana 8): Polimento de UX**
**Objetivo:** Melhorar usabilidade e consistência visual

#### Tarefas:
- [ ] Breadcrumbs em todas as páginas
- [ ] Confirmação antes de deletar (modal)
- [ ] Mensagens de erro amigáveis (toast notifications)
- [ ] Loading states consistentes
- [ ] Empty states (quando não há dados)
- [ ] Validação de formulários (campos obrigatórios)
- [ ] Tooltips explicativos
- [ ] Atalhos de teclado (ESC para fechar modais, etc)
- [ ] Responsividade mobile (ajustes finos)

**Entregáveis:**
- Sistema polido e profissional
- UX consistente em todas as telas

**Esforço:** 12-16 horas

---

## 📊 RESUMO DE ESFORÇO

| Sprint | Foco | Horas Estimadas |
|--------|------|-----------------|
| 1 | Notificações | 16-20h |
| 2 | Tarefas Unificadas | 8-12h |
| 3 | Busca Global | 12-16h |
| 4 | Estoque - Alertas | 10-14h |
| 5 | Estoque - Histórico | 14-18h |
| 6 | Integrações | 16-20h |
| 7 | Polimento UX | 12-16h |
| **TOTAL** | **7 sprints** | **88-116h** |

---

## 🎯 CRITÉRIOS DE SUCESSO

### Métricas Técnicas
- [ ] 100% das notificações entregues em < 1 segundo
- [ ] Busca global retorna resultados em < 200ms
- [ ] Zero queries N+1 (otimização de joins)
- [ ] Lighthouse Score > 90 (Performance)

### Métricas de Negócio
- [ ] 80% dos usuários usam notificações na primeira semana
- [ ] 50% dos usuários usam busca global semanalmente
- [ ] Redução de 30% em tarefas atrasadas (devido a lembretes)
- [ ] Zero divergências de estoque > 10% sem NC

### Métricas de UX
- [ ] NPS > 50 (satisfação do usuário)
- [ ] Tempo para completar tarefa < 2 minutos
- [ ] Taxa de erro em formulários < 5%

---

## 🚨 RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Performance com muitas notificações | Média | Alto | Paginação + índices otimizados |
| Busca lenta em base grande | Alta | Médio | Full-text search + cache |
| Triggers causando lentidão | Baixa | Alto | Async jobs (Supabase Edge Functions) |
| Usuários não adotam notificações | Média | Médio | Onboarding + tour guiado |

---

## 📝 PRÓXIMOS PASSOS IMEDIATOS

### Esta Semana (Próximos 3 dias):
1. ✅ Executar `supabase_schema_notificacoes.sql` no Supabase
2. ⏳ Criar `notificacoesService.ts`
3. ⏳ Criar componente `NotificationBell`
4. ⏳ Testar fluxo de notificação end-to-end

### Semana que Vem:
5. ⏳ Implementar Tarefas Unificadas
6. ⏳ Começar Busca Global

---

## 🤝 APROVAÇÃO NECESSÁRIA

**Antes de prosseguir, confirme:**
- [ ] Prioridades estão corretas?
- [ ] Cronograma é viável?
- [ ] Alguma feature deve ser antecipada/adiada?
- [ ] Recursos (tempo/pessoas) estão disponíveis?

---

**Documento criado em:** 2026-02-07  
**Última atualização:** 2026-02-07  
**Status:** 🟡 Aguardando aprovação para iniciar Sprint 1
