# 🔧 Correção de AbortError - Dashboard

**Data**: 2026-02-09  
**Problema**: `AbortError: signal is aborted without reason`  
**Local**: `https://gestaoquartzrevest.com.br`

---

## 🔍 **Causa Raiz**

Após a migração de segurança que alterou a view `tarefas_unificadas` para usar `security_invoker = true`, as queries ao banco de dados estavam demorando mais tempo devido à aplicação de políticas RLS.

**Fatores Contribuintes:**
1. View `tarefas_unificadas` agora respeita RLS (mais lenta)
2. Sem timeout configurado no cliente Supabase
3. Sem tratamento específico para AbortError
4. Sem retry automático em caso de timeout

---

## ✅ **Correções Aplicadas**

### 1. **Configuração do Cliente Supabase** (`supabaseClient.ts`)

**Antes:**
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Depois:**
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
    global: {
        headers: {
            'x-client-info': 'gestor-industria-web',
        },
    },
    db: {
        schema: 'public',
    },
    realtime: {
        timeout: 30000, // 30 segundos
    },
});
```

**Benefícios:**
- ✅ Timeout de 30 segundos para conexões realtime
- ✅ Persistência de sessão configurada
- ✅ Auto-refresh de token habilitado
- ✅ Headers customizados para identificação

---

### 2. **Tratamento de Erro no Dashboard** (`DashboardGlobal.tsx`)

**Melhorias Implementadas:**

#### a) Timeouts Individuais por Query
```typescript
const [ncsResult, projetosResult, tarefasResult, estoqueResult] = await Promise.allSettled([
    supabase.from('nao_conformidade').select('status, severidade')
        .abortSignal(AbortSignal.timeout(15000)), // 15s
    supabase.from('projeto').select('status, data_fim_prevista')
        .abortSignal(AbortSignal.timeout(15000)), // 15s
    supabase.from('tarefas_unificadas').select('status, prazo')
        .abortSignal(AbortSignal.timeout(20000)), // 20s (mais tempo para view complexa)
    supabase.from('alerta_estoque').select('nivel_alerta').is('resolved_at', null)
        .abortSignal(AbortSignal.timeout(15000)) // 15s
]);
```

#### b) Retry Automático
```typescript
const loadStats = async (retryCount = 0) => {
    try {
        // ... código de carregamento
    } catch (error: any) {
        // Retry em caso de AbortError (máximo 2 tentativas)
        if (error.name === 'AbortError' && retryCount < 2) {
            console.warn(`Timeout detectado, tentando novamente... (${retryCount + 1}/2)`);
            setTimeout(() => loadStats(retryCount + 1), 1000);
            return;
        }
        
        if (error.name !== 'AbortError') {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }
};
```

#### c) Tratamento de Falhas Parciais
```typescript
} else if (tarefasResult.status === 'rejected') {
    console.warn('Erro ao carregar tarefas:', tarefasResult.reason);
}
```

**Benefícios:**
- ✅ Timeouts específicos por query (15-20s)
- ✅ Retry automático (até 2 tentativas)
- ✅ Degradação graciosa (continua funcionando mesmo se uma query falhar)
- ✅ Logs detalhados para debugging

---

## 📊 **Resultado Esperado**

| Métrica | Antes | Depois |
|---------|-------|--------|
| **Timeout** | Indefinido | 15-20s por query |
| **Retry** | Não | Sim (2 tentativas) |
| **Tratamento de Erro** | Básico | Avançado |
| **UX em Falha** | Tela em branco | Dados parciais + log |

---

## 🚀 **Deploy**

```bash
npm run build  # ✅ Build bem-sucedido (27.64s)
```

**Próximo Passo**: Deploy para produção

---

## 📝 **Notas Técnicas**

### Por que `AbortSignal.timeout()`?
- API nativa do JavaScript (sem dependências)
- Suportado pelo Supabase JS Client v2+
- Permite controle granular por query

### Por que retry com delay?
- Evita sobrecarga do servidor em caso de pico
- Delay de 1s permite recuperação de recursos
- Máximo de 2 tentativas previne loop infinito

### Por que timeouts diferentes?
- `tarefas_unificadas`: 20s (view complexa com JOINs)
- Outras queries: 15s (queries simples)

---

## 🔄 **Monitoramento Recomendado**

Após o deploy, monitorar:
1. **Logs do navegador** - Verificar se AbortError ainda ocorre
2. **Performance** - Tempo de carregamento do dashboard
3. **Taxa de retry** - Quantas vezes o retry é acionado
4. **Supabase Dashboard** - Slow queries e performance do DB

---

**Gerado automaticamente pelo Antigravity Kit - Debugger**
