# PLAN: Material Entry & Parts Inventory (QuartzRevest)

> **Goal:** Implement "Entrada de Matéria Prima" with history logging and create a new "Estoque de Peças" module, using in-memory persistence.

---

## 1. Domain Object Model (Types)

### New Entity: `MecanicaInsumo`
Represents mechanical parts and industrial supplies.
- `id`: string
- `nome`: string
- `categoria`: 'PECA' | 'INSUMO'
- `quantidade_atual`: number
- `minimo_seguranca`: number
- `localizacao`: string (optional)

### Updated Entity: `EntradaMateriaPrima` (Verification)
Ensure it captures:
- `nota_fiscal`
- `fornecedor`
- `data_entrada`

---

## 2. In-Memory Data Store (`/services/mockData.ts`)

Since we are delaying Supabase, we will create a singleton service to hold the state.
- `inventoryMP`: List of `MateriaPrima`
- `inventoryParts`: List of `MecanicaInsumo`
- `historyEntries`: List of `EntradaMateriaPrima`

**Methods:**
- `getMateriaPrimas()`
- `addEntradaMateriaPrima(entry)` -> Updates stock + Adds to history
- `getPecas()`
- `addPeca(item)`
- `updatePecaStock(id, qty)`

---

## 3. Frontend Implementation

### A. Raw Material Entry (`/pages/EntradaMaterial.tsx`)
- **UI:** Form with:
    - Select Material (Dropdown)
    - Quantity Input
    - Invoice (Nota Fiscal) Input
    - Supplier Input
- **Action:** On submit, call `addEntradaMateriaPrima`.
- **Feedback:** "Entry registered successfully! New stock: X".
- **History View:** Small table below form showing last 5 entries.

### B. Parts Inventory (`/pages/EstoquePecas.tsx`) **[NEW]**
- **UI:** Registry & List view.
- **Features:**
    - List all parts/inputs.
    - "Add New Part" Modal/Form.
    - "Update Stock" (+/-) actions.
    - Filter by Category (Peça vs Insumo).

### C. Navigation
- Update `Sidebar.tsx` to include "Estoque de Peças".
- Update `App.tsx` router.

---

## 4. Execution Steps
1.  **Define Types:** Update `types.ts`.
2.  **Create Service:** `src/services/store.ts` (Simple generic store).
3.  **Implement Parts Page:** Create `src/pages/EstoquePecas.tsx`.
4.  **Implement Entry Logic:** Update `src/pages/EntradaMaterial.tsx`.
5.  **Wire Navigation:** Update `Sidebar.tsx` and `App.tsx`.
