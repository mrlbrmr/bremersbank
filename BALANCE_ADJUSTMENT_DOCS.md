# Documentação Técnica - Sistema de Ajuste de Saldo

## Visão Geral

O sistema de Ajuste de Saldo permite que usuários façam correções manuais no saldo real de forma rastreável e persistente. Cada ajuste é registrado como um registro separate na tabela `balance_adjustments` do Supabase, garantindo auditoria completa e sincronização em tempo real.

## Arquitetura

### 1. Banco de Dados (Supabase)

**Tabela: `balance_adjustments`**
```sql
- id (UUID): Identificador único
- user_id (UUID): FK para auth.users
- description (TEXT): Descrição legível do ajuste (ex: "Ajuste de saldo: +1000.00")
- amount (NUMERIC): Valor do ajuste (pode ser +/-)
- adjustment_date (DATE): Data do ajuste
- reason (TEXT): Motivo adicional (ex: "Ajuste manual de saldo")
- created_at (TIMESTAMP): Quando foi criado
- updated_at (TIMESTAMP): Quando foi atualizado
```

**Segurança:**
- Row Level Security (RLS) ativado
- Políticas permitem que usuários vejam/editem apenas seus próprios ajustes
- Índices em `user_id` e `adjustment_date` para performance

**Realtime:**
- Publicação adicionada ao `supabase_realtime`
- Mudanças são sincronizadas em tempo real

---

### 2. Serviço (`src/services/balanceAdjustments.ts`)

**Função: `getBalanceAdjustments()`**
- Retorna todos os ajustes do usuário autenticado
- Ordenado por `adjustment_date` descendente

**Função: `getBalanceAdjustmentsByMonth(year, month)`**
- Retorna ajustes de um mês específico
- Útil para cálculos mensais

**Função: `calculateTotalAdjustment(year, month)`**
- Retorna soma dos ajustes do mês
- Retorna `0` se não houver ajustes

**Função: `addBalanceAdjustment(adjustment)`**
- Cria novo ajuste
- Validação: `amount` não pode ser `0`
- Requer autenticação
- Retorna o ajuste criado

**Função: `deleteBalanceAdjustment(adjustmentId)`**
- Remove um ajuste específico
- Validação de propriedade (só o dono pode deletar)
- Requer autenticação

**Função: `updateBalanceAdjustment(adjustmentId, updates)`**
- Atualiza um ajuste existente
- Valida propriedade do ajuste
- Atualiza campos `updated_at` automaticamente

---

### 3. Hook (`src/hooks/useBalanceAdjustments.ts`)

**Props:**
```typescript
date: Date // Mês/ano para buscar ajustes
```

**Retorno:**
```typescript
{
  adjustments: BalanceAdjustment[], // Lista de ajustes do mês
  totalAdjustment: number,           // Soma dos ajustes
  loading: boolean,                  // Estado de carregamento
  error: string | null,              // Mensagem de erro se houver
  addAdjustment(),                   // Função para adicionar ajuste
  deleteAdjustment(),                // Função para deletar ajuste
  updateAdjustment(),                // Função para atualizar ajuste
  refetch()                          // Função para recarregar dados
}
```

**Funcionalidades:**
- Carrega ajustes do mês
- Sincroniza em tempo real com Supabase
- Tratamento de erros
- Callbacks async para operações

---

### 4. Componente (`src/components/AdjustmentHistory.tsx`)

**Props:**
```typescript
selectedMonth: Date // Mês/ano para exibir
```

**Features:**
- Exibe lista de ajustes do mês
- Expansível/colapsável
- Mostra descrição, data e valor
- Botão para deletar ajustes
- Loading state
- Desaparece se não houver ajustes

---

### 5. Integração Dashboard (`src/pages/Index.tsx`)

**BalanceCard:**
- Recebe `adjustment` (totalAdjustment do hook)
- Callback `onAdjustmentChange` usa `handleAdjustmentChange`
- UI permite editar o ajuste

**handleAdjustmentChange:**
```typescript
async (newValue: number) => {
  const difference = newValue - totalAdjustment;
  if (difference === 0) return;
  
  // Cria novo ajuste com a diferença
  await addAdjustment(...);
  
  toast.success("Saldo ajustado com sucesso!");
}
```

**AdjustmentHistory:**
- Exibido logo após BalanceCard
- Mostra histórico expandível
- Permite remover ajustes

---

## Fluxo de Dados

### Adicionar Ajuste:
```
User interage com BalanceCard
  ↓
enter novo valor no input
  ↓
handleAdjustmentChange(newValue)
  ↓
calcula difference = newValue - totalAdjustment
  ↓
se difference != 0:
  addAdjustment(description, difference, date, reason)
  ↓
  POST to Supabase balance_adjustments
  ↓
  Hook recebe notificação realtime
  ↓
  UI atualiza automaticamente (adjustments, totalAdjustment)
  ↓
```

### Remover Ajuste:
```
User clica botão de deletar em AdjustmentHistory
  ↓
deleteAdjustment(adjustmentId)
  ↓
DELETE from Supabase balance_adjustments
  ↓
Hook recebe notificação realtime
  ↓
UI atualiza (components rerender)
```

### Sincronização Realtime:
```
Outra aba/dispositivo faz ajuste
  ↓
Tabela muda no Supabase
  ↓
Canal realtime notifica subs
  ↓
Hook chama fetchAdjustments()
  ↓
Estado atualiza (adjustments, totalAdjustment)
  ↓
UI refletie mudança
```

---

## Cálculo de Saldo

```typescript
// Saldo base (transações)
saldoAtual = receitas_realizadas - despesas_realizadas

// Saldo ajustado
adjustedSaldo = saldoAtual + totalAdjustment

// Se totalAdjustment = 1000:
// adjustedSaldo = saldoAtual + 1000
```

---

## Segurança e Validações

✅ **Autenticação obrigatória** - Todas as funções requerem sessão
✅ **RLS no Supabase** - Usuários veem apenas seus próprios dados  
✅ **Validação de propriedade** - Antes de DELETE/UPDATE, valida usuario_id
✅ **Validação de amount** - Rejeita amount = 0
✅ **Tratamento de erro** - Todos os erros são capturados e logados
✅ **Auditoria** - Cada ajuste fica registrado com timestamp

---

## Compatibilidade

### Não altera:
- ✅ Cálculo de saldo base (transações)
- ✅ Parcelamentos
- ✅ Transações recorrentes
- ✅ Relatórios e gráficos
- ✅ Sincronização com BD
- ✅ Nenhum hook/componente existente

### Funciona seamlessly com:
- ✅ Confirmações de transações
- ✅ Múltiplos ajustes por mês
- ✅ Modificações de transações virtuais
- ✅ Mudança de mês
- ✅ Múltiplos dispositivos/abas

---

## Testes Sugeridos

### 1. Caso: Adicionar Ajuste
- [ ] Abrir BalanceCard
- [ ] Clicar "Ajustar saldo"
- [ ] Inserir novo valor
- [ ] Clicar "Salvar"
- [ ] Verificar toast de sucesso
- [ ] Verificar saldo atualizado corretamente
- [ ] Verificar aparece em AdjustmentHistory

### 2. Caso: Deletar Ajuste
- [ ] Abrir AdjustmentHistory
- [ ] Clicar botão deletar
- [ ] Verificar ajuste removido
- [ ] Verificar saldo recalculado
- [ ] Verificar toast de sucesso

### 3. Caso: Múltiplos Ajustes
- [ ] Adicionar 3+ ajustes
- [ ] Verificar totalAdjustment = soma de todos
- [ ] Verificar saldo ajustado correto
- [ ] Deletar um ajuste intermediário
- [ ] Verificar recálculo automático

### 4. Caso: Sincronização Realtime
- [ ] Abrir app em 2 abas
- [ ] Na aba 1: adicionar ajuste
- [ ] Verificar aba 2 atualiza automaticamente
- [ ] Verificar saldos sincronizados

### 5. Caso: Mudar Mês
- [ ] Adicionar ajuste em mês A
- [ ] Mudar para mês B (sem ajustes)
- [ ] Verificar totalAdjustment = 0
- [ ] Mudar de volta para A
- [ ] Verificar ajuste original retorna

### 6. Caso: Interação com Transações
- [ ] Ter transações no mês
- [ ] Calcular salde com ajuste
- [ ] Remover uma transação
- [ ] Verificar ajuste ainda funciona
- [ ] Verificar saldo se atualiza corretamente

### 7. Caso: Persistência
- [ ] Adicionar ajuste
- [ ] Refresh página
- [ ] Verificar ajuste persiste
- [ ] Fechar browser
- [ ] Reabrir aplicação
- [ ] Verificar ajuste ainda lá

---

## Troubleshooting

**Ajuste não aparece após salvar:**
- Verificar console para erros
- Verificar autenticação ativa
- Verificar RLS policies no Supabase
- Testar em acesso privado (não cache)

**Sincronização não funciona:**
- Verificar conexão com Supabase
- Verificar realtime ativado no projeto
- Verificar table adicionada à publicação
- Checar filtro do canal realtime

**Saldo calculado incorreto:**
- Verificar se há conflito com transações
- Revisar handleAdjustmentChange logic
- Confirmar totalAdjustment está sendo passado certo

**Performance lenta:**
- Verificar índices em user_id, adjustment_date
- Limitar histórico para N ajustes
- Usar paginação se necessário

---

## Roadmap Futuro

- [ ] Editar ajustes existentes (não só deletar)
- [ ] Categorizar ajustes (correção, sincronização, etc)
- [ ] Análise/relatório de ajustes
- [ ] Notificações quando ajuste é feito
- [ ] Permissões de auditoria (admin view)
- [ ] Bulk operations (múltiplos ajustes)
