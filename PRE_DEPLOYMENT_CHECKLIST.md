# ✅ PRÉ-IMPLANTAÇÃO - Checklist de Verificação

## 🚀 Antes de Começar

Use este checklist para garantir que tudo está pronto antes de implantar a funcionalidade de Ajuste de Saldo.

---

## 📋 Requisitos do Sistema

- [ ] **Node.js** - Versão 18+ instalada
- [ ] **npm** - Versão 9+ instalada
- [ ] **Git** - Versão 2+ instalada
- [ ] **Supabase Project** - Ativo e acessível
- [ ] **Conexão Internet** - Estável e funcionando

Verificar:
```bash
node --version    # Deve mostrar v18.x ou superior
npm --version     # Deve mostrar 9.x ou superior
git --version     # Deve mostrar 2.x ou superior
```

---

## 📁 Arquivos do Projeto

### ✅ Novos Arquivos (9 total)
- [ ] `supabase/migrations/20260407180000_create_balance_adjustments.sql` - Existe e tem ~60 linhas
- [ ] `src/services/balanceAdjustments.ts` - Existe com 182 linhas
- [ ] `src/services/balanceAdjustments.test.ts` - Existe com 352 linhas
- [ ] `src/hooks/useBalanceAdjustments.ts` - Existe com 152 linhas
- [ ] `src/components/AdjustmentHistory.tsx` - Existe com 122 linhas
- [ ] `BALANCE_ADJUSTMENT_DOCS.md` - Documentação técnica
- [ ] `QUICK_START_BALANCE_ADJUSTMENT.md` - Guia rápido
- [ ] `ARCHITECTURE_BALANCE_ADJUSTMENT.md` - Diagramas
- [ ] `IMPLEMENTATION_SUMMARY.md` - Resumo
- [ ] `FILES_MAP.md` - Mapa de arquivos

### ✅ Arquivos Modificados (2 total)
- [ ] `src/pages/Index.tsx` - Contém import de useBalanceAdjustments
- [ ] `src/integrations/supabase/types.ts` - Contém balance_adjustments table type

Verificar modificações:
```bash
git diff src/pages/Index.tsx
git diff src/integrations/supabase/types.ts
```

---

## 🔧 Dependências

### Verificar que nenhuma nova dependência foi adicionada:
```bash
npm list | grep balance
# Não deve retornar nada (usamos código nativo)
```

### Dependências Existentes Usadas:
- [ ] react (já instalado)
- [ ] supabase-js (já instalado)
- [ ] sonner (já instalado) - para toast notifications
- [ ] lucide-react (já instalado) - para ícones

---

## 📦 Build e Compilação

### ✅ Verificar compilação
```bash
npm run build
```

Esperado:
- [ ] Nenhum erro TypeScript
- [ ] Build completado com sucesso
- [ ] Message "built in X.XXs"

### ✅ Verificar tipos
```bash
npm run lint
```

Esperado:
- [ ] Sem erros de linting
- [ ] Sem warnings críticos

---

## 🗄️ Supabase Setup

### ✅ Preparar Banco de Dados

1. **Login no Supabase Dashboard**
   - [ ] Acesso ao projeto correto

2. **Validar Tabelas Existentes**
   - [ ] Tabela `transactions` existe
   - [ ] Tabela `recurring_transactions` existe
   - [ ] Tabela `installments` existe
   - [ ] Tabela `categories` existe

3. **Preparar para Migração**
   - [ ] Fazer backup do projeto (opcional: Supabase → Settings → Database → Backups)
   - [ ] Ir a SQL Editor
   - [ ] Verificar que está usando o schema "public"

### ✅ Executar Migração SQL

```bash
# Opção 1: Via Supabase CLI (recomendado)
supabase migration up

# Opção 2: Manual no Dashboard
# 1. Copie conteúdo de: supabase/migrations/20260407180000_create_balance_adjustments.sql
# 2. Vá para Supabase Dashboard → SQL Editor
# 3. Cole o código
# 4. Clique "Run"
```

**Esperado após execução:**
- [ ] Query completada sem erros
- [ ] Tabela `balance_adjustments` criada
- [ ] Índices criados:
  ```sql
  SELECT * FROM information_schema.tables 
  WHERE table_name = 'balance_adjustments';
  ```
  Deve retornar 1 linha

### ✅ Validar RLS (Row Level Security)

```sql
-- No SQL Editor, execute:
SELECT tablename FROM pg_tables 
WHERE tablename = 'balance_adjustments';

-- Verificar políticas:
SELECT policyname FROM pg_policies 
WHERE tablename = 'balance_adjustments';
```

Esperado: 4 políticas (SELECT, INSERT, UPDATE, DELETE)

### ✅ Validar Realtime

```sql
-- Verificar que está publicado:
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'balance_adjustments';
```

Esperado: 1 linha

---

## 🔐 Autenticação

### ✅ Verificar Autenticação
- [ ] Supabase Auth ativado no projeto
- [ ] Usuário teste pode fazer login
- [ ] JWT token sendo gerado corretamente

Testar (console do navegador):
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log(session); // Deve ter user object
```

---

## 💻 Ambiente Local

### ✅ Verificar Variáveis de Ambiente
- [ ] `.env.local` tem `VITE_SUPABASE_URL`
- [ ] `.env.local` tem `VITE_SUPABASE_ANON_KEY`
- [ ] URLs apontam para projeto correto
- [ ] Chaves são válidas (não expiradas)

Verificar:
```bash
cat .env.local
```

### ✅ Limpar Cache (importante!)
```bash
# Remover node_modules e locks
rm -r node_modules
rm package-lock.json

# Reinstalar
npm install

# Limpar cache Supabase
rm -rf .supabase
```

---

## 🧪 Testes Pré-Implantação

### ✅ Build Production
```bash
npm run build
```
- [ ] Sem erros
- [ ] Arquivo dist/index.html criado
- [ ] Assets compilados

### ✅ Build Development
```bash
npm run dev
```
- [ ] Aplicação inicia em localhost:5173
- [ ] Página carrega sem erros
- [ ] Console não mostra erros críticos

### ✅ Login
- [ ] Conseguir fazer login
- [ ] Sessão persiste após refresh
- [ ] Logout funciona

---

## 🎯 Teste da Funcionalidade (Local)

### ✅ Teste 1: Página Carrega
- [ ] Dashboard carrega sem erros
- [ ] BalanceCard visível
- [ ] Botão "Ajustar saldo" presente
- [ ] AdjustmentHistory não visível (sem ajustes)

### ✅ Teste 2: Adicionar Ajuste
```
1. Clique "Ajustar saldo"
   [ ] Input aparece
2. Digite valor novo (ex: 1500)
   [ ] Input aceita entrada
3. Clique "Salvar"
   [ ] Toast de sucesso aparece
4. Verifique saldo atualizado
   [ ] Novo saldo = valor + ajuste
5. Verifique AdjustmentHistory
   [ ] Ajuste aparece na lista
```

### ✅ Teste 3: Deletar Ajuste
```
1. Clique botão deletar em AdjustmentHistory
   [ ] Confirmação (if implemented)
2. Ajuste removido
   [ ] Desaparece da lista
3. Saldo recalculado
   [ ] Volta ao valor anterior
4. Toast de sucesso aparece
   [ ] "Ajuste removido com sucesso!"
```

### ✅ Teste 4: Refresh Persistência
```
1. Depois de adicionar ajuste
2. Pressione F5 (refresh)
   [ ] Página recarrega
3. Ajuste ainda lá
   [ ] AdjustmentHistory mostra ajuste
4. Saldo mantém seu valor
   [ ] Persistência funciona
```

### ✅ Teste 5: Múltiplas Abas
```
1. Abra app em 2 abas
   [ ] Ambas carregam normalmente
2. Na aba 1: adicione ajuste
   [ ] Toast confirma
3. Mude para aba 2
   [ ] Sem refresh, vê ajuste? (depende timing)
   [ ] Após refresh, vê ajuste
4. Na aba 2: delete ajuste
5. Aba 1 atualiza
   [ ] Pode revisar se sincroniza
```

---

## 📊 Validações Finais

### ✅ Compatibilidade
- [ ] Transações ainda funcionam
- [ ] Parcelamentos ainda funcionam
- [ ] Transações recorrentes ainda funcionam
- [ ] Relatórios ainda funcionam
- [ ] Nenhum erro no console

### ✅ Segurança
- [ ] Só pode ajustar seu próprio saldo
- [ ] Dados não vazam para outros usuários
- [ ] Erros não expõem informações sensíveis

### ✅ Performance
- [ ] Página carrega em tempo razoável
- [ ] Operações de ajuste são rápidas (<1s)
- [ ] Não há lag na UI
- [ ] Console não mostra warnings

---

## 📝 Documentação

### ✅ Ler Setup
- [ ] IMPLEMENTATION_SUMMARY.md - Entender o que foi feito
- [ ] QUICK_START_BALANCE_ADJUSTMENT.md - Guia para testar

### ✅ Documentação Técnica
- [ ] BALANCE_ADJUSTMENT_DOCS.md - Para troubleshooting
- [ ] ARCHITECTURE_BALANCE_ADJUSTMENT.md - Para entender fluxos
- [ ] FILES_MAP.md - Para navegar arquivos

---

## 🔄 Rollback Plan (Se necessário)

Se der problema, você pode reverter:

### Via Git:
```bash
# Ver commits recentes
git log --oneline

# Reverter para antes da mudança
git revert COMMIT_HASH

# Ou fazer reset (cuidado!)
git reset --hard BEFORE_CHANGE_HASH
```

### Via Supabase:
```bash
# Remover migração (cuidado!)
# Via Dashboard: SQL Editor
DROP TABLE IF EXISTS public.balance_adjustments CASCADE;
```

---

## ✨ Status Final

### Marque como completo quando:

- [x] Todos os arquivos existem
- [x] Build sem erros
- [x] Banco de dados migrado
- [x] Autenticação funciona
- [x] Testes básicos passam
- [x] Documentação lida
- [x] Funcionalidade testada
- [x] Sem erros no console
- [x] Performance aceitável
- [x] Compatibilidade confirmada

---

## 🎉 Aprovado para Implantação!

Quando todos os itens acima estão marcados:

✅ **Sistema pronto para produção**

### Próximos Passos:
1. Fazer backup final do banco
2. Documentar versão (ex: v1.0-balance-adjustment)
3. Comunicar ao time sobre nova feature
4. Monitorar erros nos primeiros dias
5. Coletar feedback dos usuários

---

## 📞 Precisa de Ajuda?

Se algum teste falhar:

1. **Checking Console**
   - Abra DevTools (F12)
   - Vá para "Console"
   - Procure por mensagens de erro

2. **Checking Supabase**
   - Vá para Supabase Dashboard
   - Vá para "Logs" → "Database Logs"
   - Procure por erros recent

3. **Checking Docs**
   - Veja BALANCE_ADJUSTMENT_DOCS.md "Troubleshooting"
   - Veja ARCHITECTURE_BALANCE_ADJUSTMENT.md "Error Handling"

4. **Checking Code**
   - Veja comentários inline nos arquivos
   - Revise tipos em types.ts

---

**Boa sorte! 🚀**

Data de Verificação: __________  
Verificado por: __________  
Status: ________ (OK / NÃO OK)
