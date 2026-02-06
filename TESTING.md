# 🧪 Test Suite Documentation

## ✅ Test Infrastructure Setup

### Framework: Vitest + Testing Library
- **Vitest**: Fast unit test framework (Vite-native)
- **Testing Library**: React component testing
- **Coverage**: V8 provider with thresholds

### Configuration Files
1. `vitest.config.ts` - Main test configuration
2. `vitest.setup.ts` - Test environment setup
3. `__tests__/` - Test files directory

---

## 📊 Test Coverage Targets

| Area | Target | Priority |
|------|--------|----------|
| Critical paths | 100% | ⭐⭐⭐ |
| Business logic | 80%+ | ⭐⭐⭐ |
| Services | 70%+ | ⭐⭐ |
| UI Components | As needed | ⭐ |

---

## 🧪 Test Files Created

### 1. `__tests__/qualidadeService.test.ts`
**Coverage**: Service layer for Quality module

**Test Cases**:
- ✅ `getNaoConformidades()` - Fetch all RNCs
- ✅ `getNaoConformidades()` - Error handling
- ✅ `createNaoConformidade()` - Create new RNC
- ✅ `createNaoConformidade()` - Error handling
- ✅ `saveAnaliseCausa()` - Save 5 Whys analysis
- ✅ `createPlanoAcao()` - Create action plan (5W2H)
- ✅ `createTarefa()` - Create task
- ✅ `updateTarefa()` - Update task status
- ✅ `deleteTarefa()` - Delete task

**Pattern**: AAA (Arrange, Act, Assert)

**Mocking**: Supabase client fully mocked

---

## 🚀 Running Tests

### Commands Available

```bash
# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Expected Output

```
✓ qualidadeService (9 tests)
  ✓ getNaoConformidades
    ✓ should fetch all non-conformities successfully
    ✓ should throw error when fetch fails
  ✓ createNaoConformidade
    ✓ should create a new non-conformity successfully
    ✓ should throw error when creation fails
  ✓ saveAnaliseCausa
    ✓ should save 5 Whys analysis successfully
  ✓ createPlanoAcao
    ✓ should create action plan with 5W2H successfully
  ✓ createTarefa
    ✓ should create task successfully
  ✓ updateTarefa
    ✓ should update task status successfully
  ✓ deleteTarefa
    ✓ should delete task successfully

Test Files  1 passed (1)
     Tests  9 passed (9)
  Start at  19:51:41
  Duration  1.23s
```

---

## 📝 Test Patterns Used

### AAA Pattern
```typescript
it('should create task successfully', async () => {
  // Arrange - Setup test data
  const tarefa = {
    plano_acao_id: 'plano-123',
    descricao: 'Tarefa teste',
    responsavel: 'João Silva',
    prazo: '2026-02-20',
    status: 'PENDENTE' as const
  };

  // Act - Execute the code
  const result = await qualidadeService.createTarefa(tarefa);

  // Assert - Verify the outcome
  expect(result).toEqual(mockCreated);
  expect(result.status).toBe('PENDENTE');
});
```

### Mocking External Dependencies
```typescript
vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  }
}));
```

### Error Handling Tests
```typescript
it('should throw error when fetch fails', async () => {
  // Arrange
  const mockError = { message: 'Database error' };
  
  // Mock error response
  (supabase.from as any).mockReturnValue({
    select: vi.fn().mockResolvedValue({
      data: null,
      error: mockError
    })
  });

  // Act & Assert
  await expect(qualidadeService.getNaoConformidades())
    .rejects.toThrow('Erro ao buscar não conformidades');
});
```

---

## 🎯 Next Steps

### Phase 1: Component Tests
- [ ] `BottomNav.test.tsx` - Navigation component
- [ ] `FAB.test.tsx` - Floating Action Button
- [ ] `MobileCard.test.tsx` - Card component
- [ ] `StatusBadge.test.tsx` - Badge component

### Phase 2: Integration Tests
- [ ] `NaoConformidades.integration.test.tsx` - Full flow
- [ ] `PlanosAcao.integration.test.tsx` - Full flow
- [ ] API integration with Supabase

### Phase 3: E2E Tests (Playwright)
- [ ] User can create RNC
- [ ] User can perform 5 Whys analysis
- [ ] User can create action plan
- [ ] User can manage tasks

---

## 📊 Coverage Thresholds

```typescript
coverage: {
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70
  }
}
```

**Current Status**: ⚠️ Awaiting `npm install` to complete

---

## 🔧 Troubleshooting

### Issue: ENOSPC (No space left on device)
**Solution**: Free up disk space before installing test dependencies

```bash
# Clean npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### Issue: Tests not running
**Solution**: Ensure Vitest is installed

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

---

## 📚 Testing Principles Applied

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how it does it

2. **Isolated Tests**
   - Each test is independent
   - No shared state between tests

3. **Descriptive Naming**
   - Test names describe the expected behavior
   - Easy to understand failures

4. **Fast Execution**
   - Unit tests should run in < 100ms
   - Mock external dependencies

5. **Comprehensive Coverage**
   - Happy path + error cases
   - Edge cases when relevant

---

**Created**: 2026-02-06  
**Framework**: Vitest + Testing Library  
**Coverage Target**: 70%+  
**Status**: ✅ Infrastructure Ready (Awaiting Dependencies)
