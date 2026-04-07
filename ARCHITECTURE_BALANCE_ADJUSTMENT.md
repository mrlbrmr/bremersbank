# Arquitetura - Sistema de Ajuste de Saldo

## Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUÁRIO                                  │
│  Interage com BalanceCard no Dashboard                          │
└───────────────┬─────────────────────────────────────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │  BalanceCard Component    │
    │  - Mostra saldo atual     │
    │  - Botão "Ajustar saldo"  │
    │  - Input de novo valor    │
    └───────────┬───────────────┘
                │
                ▼
    ┌───────────────────────────────────┐
    │  handleAdjustmentChange()         │
    │  Interface: Index.tsx             │
    │  - Calcula: difference = novo - atual
    │  - Se difference != 0:            │
    │    → Chama addAdjustment()        │
    └───────────┬───────────────────────┘
                │
                ▼
    ┌──────────────────────────────────────────┐
    │  useBalanceAdjustments Hook              │
    │  - Gerencia estado dos ajustes           │
    │  - Sincroniza com Supabase Realtime      │
    │  - Callbacks: add/delete/update          │
    └───────────┬────────────────────────────┘
                │
                ▼
    ┌──────────────────────────────────────────────────┐
    │  balanceAdjustments Service (Supabase Client)     │
    │  - addBalanceAdjustment()                         │
    │  - deleteBalanceAdjustment()                      │
    │  - getBalanceAdjustmentsByMonth()                 │
    │  - calculateTotalAdjustment()                     │
    └───────────┬────────────────────────────────────┘
                │ (POST/DELETE/GET via Postgrest)
                ▼
    ┌────────────────────────────────────────────┐
    │         SUPABASE PROJECT                    │
    │                                             │
    │  PostgreSQL Table:                         │
    │  ┌──────────────────────────────────────┐ │
    │  │ balance_adjustments                  │ │
    │  ├──────────────────────────────────────┤ │
    │  │ id (UUID PK)                         │ │
    │  │ user_id (UUID FK) - RLS              │ │
    │  │ description (TEXT)                   │ │
    │  │ amount (NUMERIC)                     │ │
    │  │ adjustment_date (DATE)               │ │
    │  │ reason (TEXT)                        │ │
    │  │ created_at (TIMESTAMP)               │ │
    │  │ updated_at (TIMESTAMP)               │ │
    │  │                                      │ │
    │  │ Indices: (user_id), (adjustment_date)│ │
    │  │ RLS: Ativo com políticas auth        │ │
    │  │ Realtime: Publicado                  │ │
    │  └──────────────────────────────────────┘ │
    │                                             │
    │  Postgrest: REST API                        │
    │  Realtime: WebSocket subscriptions          │
    └────────────────────────────────────────────┘
                │
                │ (Realtime: notificação de mudanças)
                │
                ▼
    ┌──────────────────────────────────────────┐
    │  useBalanceAdjustments Hook               │
    │  (Listener do canal realtime)             │
    │  - Recebe notificação de mudança          │
    │  - Chama fetchAdjustments()               │
    │  - Atualiza estado (adjustments, total)   │
    └───────────┬────────────────────────────┘
                │
                ▼
    ┌────────────────────────────────┐
    │  React State Update             │
    │  - adjustments[]                │
    │  - totalAdjustment              │
    └───────────┬────────────────────┘
                │
                ▼
    ┌────────────────────────────────────┐
    │  Componentes re-renderizam:         │
    │  - BalanceCard (novo saldo)         │
    │  - AdjustmentHistory (novo item)    │
    │  - Dashboard (saldo atualizado)     │
    └──────────────────────────────────┘
```

---

## Fluxo de Dados - Adicionar Ajuste

```
1. USER INTERACTION
   ┌─────────────────────────────┐
   │ Clica "Ajustar saldo"       │
   │ Insere novo valor           │
   │ Clica "Salvar"              │
   └────────────┬────────────────┘
                │
2. VALIDATION
                ▼
   ┌──────────────────────────────┐
   │ handleAdjustmentChange()     │
   │ - Valida autenticação         │
   │ - Calcula diferença           │
   │ - Rejeita se difference == 0  │
   └────────────┬─────────────────┘
                │
3. SERVICE CALL
                ▼
   ┌─────────────────────────────────┐
   │ addBalanceAdjustment()          │
   │ - Valida amount != 0            │
   │ - Obtém session.user.id         │
   │ - Prepara objeto de inserção    │
   └────────────┬────────────────────┘
                │
4. DATABASE INSERT
                ▼
   ┌────────────────────────────────────┐
   │ Supabase.from('balance_adjustments')│
   │   .insert({...})                    │
   │   .select()                         │
   │   .single()                         │
   └────────────┬─────────────────────┘
                │
5. TRIGGERS & REALTIME
                ▼
   ┌──────────────────────────────────────┐
   │ PostgreSQL INSERT trigger           │
   │ - Atualiza updated_at               │
   │ - Emite notificação Realtime        │
   └────────────┬───────────────────────┘
                │
6. WEBHOOK NOTIFICATION
                ▼
   ┌──────────────────────────────────────┐
   │ Supabase Realtime notifica:          │
   │ "balance_adjustments INSERT"         │
   │ filter: user_id = CURRENT_USER_ID   │
   └────────────┬───────────────────────┘
                │
7. CLIENT RECEIVES
                ▼
   ┌──────────────────────────────────────┐
   │ Hook listener dispara:               │
   │ channel.on('postgres_changes', ...)  │
   │ - Executa fetchAdjustments()         │
   └────────────┬───────────────────────┘
                │
8. DATA REFRESH
                ▼
   ┌──────────────────────────────────────┐
   │ fetchAdjustments():                  │
   │ - Query adjustments do mês           │
   │ - Calcula total                      │
   │ - Atualiza state                     │
   └────────────┬───────────────────────┘
                │
9. UI RERENDER
                ▼
   ┌──────────────────────────────────────┐
   │ Componentes re-renderizam:           │
   │ - BalanceCard: novo saldo            │
   │ - AdjustmentHistory: novo item       │
   │ - Toast: "Sucesso!"                  │
   └──────────────────────────────────────┘
```

---

## Estado React (useBalanceAdjustments)

```typescript
// Hook state interno:
{
  adjustments: BalanceAdjustment[],
  // Exemplo:
  // [
  //   {
  //     id: "uuid-1",
  //     user_id: "user-uuid",
  //     description: "Ajuste de saldo: +500.00",
  //     amount: 500,
  //     adjustment_date: "2024-04-07",
  //     reason: "Sincronização com banco",
  //     created_at: "2024-04-07T10:30:00Z",
  //     updated_at: "2024-04-07T10:30:00Z"
  //   }
  // ]

  totalAdjustment: number,
  // Exemplo: 500 (soma de todos os adjustments)

  loading: boolean,
  // true enquanto carrega dados

  error: string | null,
  // Mensagem de erro se houver

  // Callbacks async:
  addAdjustment,      // (desc, amount, date, reason) => Promise
  deleteAdjustment,   // (id) => Promise
  updateAdjustment,   // (id, updates) => Promise
  refetch             // () => Promise
}
```

---

## Fluxo de Dados - Delete Adjustment

```
User clica botão deletar em AdjustmentHistory
        │
        ▼
handleDelete(adjustmentId)
        │
        ▼
deleteAdjustment(adjustmentId)
        │
        ├─ Valida propriedade (user_id)
        │
        ▼
DELETE FROM balance_adjustments WHERE id = ?
        │
        ├─ PostgreSQL executa
        │
        ▼
Realtime notifica
        │
        ▼
Hook listener executa
        │
        ▼
fetchAdjustments() re-carrega
        │
        ▼
State atualiza:
  - adjustments (sem item deletado)
  - totalAdjustment (recalculado)
        │
        ▼
UI re-renderiza:
  - AdjustmentHistory se atualiza
  - BalanceCard mostra novo saldo
        │
        ▼
Toast: "Ajuste removido com sucesso!"
```

---

## Sincronização Realtime - Múltiplas Abas

```
┌─────────────────┐              ┌─────────────────┐
│   ABA 1         │              │   ABA 2         │
│ Conectado ao    │              │ Conectado ao    │
│ Realtime Canal  │              │ Realtime Canal  │
└────────┬────────┘              └────────┬────────┘
         │                               │
         └───────────────┬───────────────┘
                         │
                         ▼
              (Mesmo Supabase Project)
              (Mesmo user_id filter)
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
User faz ajuste em ABA 1      ABA 2 recebe notificação
   (INSERT sucesso)            (postgres_changes evento)
         │                               │
         ▼                               ▼
Realtime dispara              Hook listener executa
   (broadcast)                      │
         │                          ├─ fetchAdjustments()
         │                          │
         ▼                          ▼
ABA 1 também recebe            State atualiza
  notificação                   UI re-renderiza
(pode ignorar, já tem)          │
         │                      ▼
   (pode usar para         Mesmo saldo em ambas
   final confirmation)      (sincronizado!)
         │
         ▼
Ambas mostram novo saldo
```

---

## Security & Access Control

```
┌─────────────────────────────────────────────────────┐
│           Supabase RLS Politique                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Table: balance_adjustments                         │
│                                                     │
│ SELECT:                                            │
│   auth.uid() = user_id                             │
│   (Usuário só vê seus próprios ajustes)            │
│                                                     │
│ INSERT:                                            │
│   auth.uid() = user_id                             │
│   (Só inserir para si mesmo)                       │
│                                                     │
│ UPDATE:                                            │
│   auth.uid() = user_id                             │
│   (Só atualizar próprios ajustes)                  │
│                                                     │
│ DELETE:                                            │
│   auth.uid() = user_id                             │
│   (Só deletar próprios ajustes)                    │
│                                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│        Client-Side Validation                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 1. Verificar autenticação                         │
│    await supabase.auth.getSession()               │
│                                                     │
│ 2. Validar entrada                                │
│    - amount != 0                                   │
│    - description não vazio                         │
│    - date válida                                   │
│                                                     │
│ 3. Tratar erros                                   │
│    - Catch exceptions                              │
│    - Log para debugging                            │
│    - Toast para usuário                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Cálculo Final do Saldo

```typescript
// Transações (como sempre funcionava)
const saldoAtual = receitas_realizadas - despesas_realizadas;
// Exemplo: 3000 - 2000 = 1000

// Novo: Com Ajuste
const totalAdjustment = sumOf(balance_adjustments); 
// Exemplo: +500

// RESULTADO FINAL
const adjustedBalance = saldoAtual + totalAdjustment;
// 1000 + 500 = 1500

// Mostrado para usuário
BalanceCard {
  saldoAtual: 1500 ← (1000 + 500)
  saldoPrevisto: ... (inalterado)
  adjustment: 500 (mostrado em tooltip)
}

// Relatórios
Reports usam adjustedBalance
Dashboard usa adjustedBalance
Widget usa adjustedBalance
```

---

## Performance & Índices

```sql
-- Índice para queries do usuário
CREATE INDEX idx_balance_adjustments_user_id 
ON balance_adjustments(user_id);
Result: O(log n) lookup em vez de O(n) full scan

-- Índice para queries de período
CREATE INDEX idx_balance_adjustments_date 
ON balance_adjustments(adjustment_date);
Result: Rápido filtrar por mês/período

-- Combinado pode usar índice composto
SELECT * FROM balance_adjustments
WHERE user_id = ? AND adjustment_date >= ? AND adjustment_date <= ?
Result: Muito rápido (index scan)
```

---

## Tratamento de Erro

```
┌──────────────────┐
│ Erro no Supabase │
└────────┬─────────┘
         │
    ┌────┴─────┐
    │           │
    ▼           ▼
 Auth Invalid  DB Error
    │           │
    ▼           ▼
throw Error  throw Error
    │           │
    ▼           ▼
 Catch em     Catch em
 Service      Service
    │           │
    ▼           ▼
throw Error  throw Error
    │           │
    ▼           ▼
 Catch em     Catch em
 Hook        Hook
    │           │
    ▼           ▼
 setError    setError
    │           │
    ▼           ▼
 Log console  Log console
    │           │
    ▼           ▼
toast.error()
    │
    ▼
Usuário vê mensagem amigável
```

---

Essa arquitetura garante:
- ✅ **Segurança** via RLS + Session validation
- ✅ **Performance** via índices
- ✅ **Confiabilidade** via sincronização realtime
- ✅ **Auditoria** via timestamps
- ✅ **Escalabilidade** via Supabase managed
- ✅ **UX** via toast + loading states
