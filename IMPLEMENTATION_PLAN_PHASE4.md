# 🚀 PLANO DE IMPLEMENTAÇÃO - FASE 4 (SEGURANÇA & VALIDAÇÃO)

Este documento detalha os próximos passos para finalizar a otimização do projeto GestorIndustria.

## 🎯 OBJETIVOS DA FASE 4
1.  **Blindar o Backend**: Implementar validação de dados rigorosa.
2.  **Refinar Segurança**: Ajustar permissões RLS.
3.  **Expandir Padrões**: Levar o Logger e LoadingState para toda a app.

---

## 📋 TAREFAS PRIORITÁRIAS

### 1. Validação com Zod (Backend/Frontend)
- [ ] **Criar Schemas Zod** (`schemas/ValidationSchemas.ts`)
    - [ ] `MateriaPrimaSchema`
    - [ ] `ProdutoAcabadoSchema`
    - [ ] `EntradaSchema`
    - [ ] `ProducaoSchema`
- [ ] **Integrar nos Services**
    - [ ] Validar inputs em `store.ts` antes de enviar ao Supabase.
    - [ ] Validar inputs em `pcpService.ts`.

### 2. Refinamento de RLS (Supabase)
- [ ] **Auditar Tabelas**: Verificar tabelas com `public` access.
- [ ] **Criar Policies Granulares**:
    - [ ] Tabela `materia_prima`: Apenas Estoquista pode editar.
    - [ ] Tabela `plano_producao`: Apenas PCP/Gerente pode criar.
    - [ ] Tabela `usuarios`: Restringir leitura de dados sensíveis.

### 3. Expansão de Refatoração
- [ ] **Estoque Dashboard**:
    - [ ] Implementar `LoadingState`.
    - [ ] Substituir console.log por `logger`.
    - [ ] Refatorar layout para Bento Grid.
- [ ] **Qualidade**:
    - [ ] Implementar `ErrorBoundary` específico se necessário.

### 4. Testes
- [ ] **Configurar Vitest**:
    - [ ] Criar script de teste unitário básico.
    - [ ] Testar `utils/logger.ts` e helpers.

---

## 🛠️ FERRAMENTAS UTILIZADAS
- **Zod**: Validação de schema.
- **Supabase Policies**: Segurança nível de banco.
- **Vitest**: Testes unitários.

---

**Status Atual**: Fase 2 e 3 (Parcial) Concluídas.
**Responsável Sugerido**: `@backend-specialist` + `@security-specialist`
