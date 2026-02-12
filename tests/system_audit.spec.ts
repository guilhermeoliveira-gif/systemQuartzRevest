import { test, expect } from '@playwright/test';

test.describe('Auditoria Massiva do Sistema QuartzRevest', () => {

    test.beforeEach(async ({ page }) => {
        // Enable console logs
        page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));

        // Go to root
        await page.goto('/');

        // Check if we are on Login page by looking for Demo Button
        // We use a short timeout because if it's there, it should be visible quickly
        try {
            const demoBtn = page.getByText('Acesso Rápido (Demo Mode)');
            if (await demoBtn.isVisible({ timeout: 5000 })) {
                console.log('Login page detected, using Demo Mode...');
                await demoBtn.click();
            }
        } catch (e) {
            // If not found, assume we are either logged in or loading
            console.log('Demo button not found, checking Dashboard...');
        }

        // Wait for Dashboard (Selecione o Módulo)
        await expect(page.getByText('Selecione o Módulo')).toBeVisible({ timeout: 30000 });
    });

    test('1. Fluxo de Checklist: Agendamento e Execução', async ({ page }) => {
        await page.goto('/#/checklist/agendamento');

        // Open Modal
        await page.getByRole('button', { name: 'Novo Agendamento' }).click();

        // Fill Form
        // We expect seeded data "Checklist Diário Teste"
        try {
            await page.selectOption('select[name="modelo_id"]', { label: 'Checklist Diário Teste' });
        } catch (e) {
            // Fallback for shadcn/ui or custom select if native fails (though code suggests native select in previous steps)
            // If Select is custom, we might need to click trigger then option
            console.log('Select failed, attempting custom select interaction for model...');
            // This is a guess, but system seemed to use native selects in some parts.
            // If it fails, the test report will tell us.
            throw e;
        }

        // Select entity (Machine)
        await page.selectOption('select[name="tipo_entidade"]', 'MAQUINA');
        await page.selectOption('select[name="entidade_id"]', { label: 'Empilhadeira 01' });

        await page.fill('input[name="data_agendada"]', '2025-12-31');

        // Submit
        await page.getByRole('button', { name: 'Confirmar Agendamento' }).click();

        // Validate Success (Toast or List update)
        await expect(page.getByText('Agendamento criado com sucesso')).toBeVisible();
    });

    test('2. Fluxo de Vendas: Criar Pedido', async ({ page }) => {
        await page.goto('/#/vendas/novo');

        // Wait for clients to load
        await page.waitForTimeout(2000);

        const clienteSelect = page.locator('select').first();
        await clienteSelect.selectOption({ index: 1 }); // Select first available client

        // Add Item
        // Check if "Adicionar Produto" button exists (it might be explicit or implied in UI)
        if (await page.getByRole('button', { name: /Adicionar Produto/i }).isVisible()) {
            await page.getByRole('button', { name: /Adicionar Produto/i }).click();
        }

        // Inputs for item usually: Product (Select), Qty (Number)
        // Assuming product select is present
        await page.locator('select').nth(1).selectOption({ label: 'Argamassa ACIII' });
        await page.fill('input[type="number"]', '10'); // Quantity

        // Confirm item add (if modal/inline)
        if (await page.getByRole('button', { name: 'Adicionar' }).isVisible()) {
            await page.getByRole('button', { name: 'Adicionar' }).click();
        }

        // Save Order
        await page.click('button:has-text("Salvar Pedido")');

        // Validate Success
        await expect(page.getByText('Pedido salvo com sucesso')).toBeVisible();
    });

    test('3. Fluxo de Não Conformidades: Registrar Problema', async ({ page }) => {
        await page.goto('/#/nao-conformidades');

        await page.click('button:has-text("Nova Não Conformidade")');

        await page.fill('input[name="titulo"]', 'Vazamento de Óleo Teste');
        await page.fill('textarea[name="descricao"]', 'Vazamento detectado durante teste massivo automatizado.');

        // Selects
        await page.selectOption('select[name="origem"]', 'PRODUCAO');
        await page.selectOption('select[name="gravidade"]', 'ALTA');

        // Submit
        await page.click('button:has-text("Salvar Registro")');

        await expect(page.getByText('Não Conformidade registrada')).toBeVisible();
    });

    // Validar Navegação Massiva (Smoke Test)
    const modulos = [
        { path: '/#/expedicao/pendencias', text: 'Gestão de Pendências' },
        { path: '/#/manutencao/maquinas', text: 'Gestão de Máquinas' },
        { path: '/#/estoque/pecas', text: 'Estoque de Peças' },
        { path: '/#/frotas', text: 'Gestão de Frotas' }
    ];

    for (const mod of modulos) {
        test(`Navegação: ${mod.text}`, async ({ page }) => {
            await page.goto(mod.path);
            await expect(page.getByText(mod.text)).toBeVisible();
        });
    }

});
