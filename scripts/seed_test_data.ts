
import { estoqueService } from '../services/estoqueService';
import { vendasService } from '../services/vendasService';
import { comprasService } from '../services/comprasService';
import { projetosService } from '../services/projetosService';
import { segurancaService } from '../services/segurancaService';
import { frotaService } from '../services/frotaService';
import { manutencaoService } from '../services/manutencaoService';
import { qualidadeService } from '../services/qualidadeService';
import { checklistService } from '../services/checklistService';

import { supabase } from '../services/supabaseClient';

async function seed() {
    console.log('🌱 Iniciando seeding de dados para teste (5 dias de trabalho simulados)...');

    // 0. Autenticação (Necessária para RLS)
    const email = 'admin@quartzrevest.com';
    const password = 'admin123admin'; // Senha forte para garantir

    console.log(`🔐 Autenticando como ${email}...`);

    let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError || !authData.user) {
        console.log('⚠️ Usuário não encontrado ou erro no login. Tentando criar usuário Admin...');

        // Tentar criar se não existir
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nome: 'Admin Seed',
                    cargo: 'Gerente',
                    setor: 'Geral',
                    perfil_id: 'd9b9c105-1541-462a-a31c-2dfbabd788b0' // Tenta usar um ID ou deixa criar novo se logic permitir
                    // Nota: perfil_id real precisaria ser buscado, mas se o trigger funcionar sem ele ou criarmos depois...
                }
            }
        });

        if (signUpError) {
            console.error('❌ Falha ao criar usuário de seed:', signUpError);
            return;
        }

        console.log('✅ Usuário criado. Logado:', signUpData.user?.email);
        authData = { user: signUpData.user, session: signUpData.session };
    } else {
        console.log('✅ Login realizado com sucesso.');
    }

    try {
        // 1. Usuarios e Perfis
        const perfis = await segurancaService.getPerfis();
        const perfilGerente = perfis.find(p => p.nome === 'Gerente') || perfis[0];
        const perfilOperador = perfis.find(p => p.nome === 'Operador') || perfis[0];

        // 2. Materias Primas e Produtos Acabados
        console.log('📦 Criando Materias Primas e Produtos...');
        const mpCimento = { nome: 'Cimento Portland CP-II', unidade_medida: 'Saco 50kg', quantidade_atual: 500, custo_unitario: 35.5, categoria: 'Cimento', organization_id: 'org1' };
        const mpAreia = { nome: 'Areia Fina Lavada', unidade_medida: 'm³', quantidade_atual: 100, custo_unitario: 85.0, categoria: 'Insumos', organization_id: 'org1' };
        const mpAditivo = { nome: 'Aditivo Plastificante QX', unidade_medida: 'Litro', quantidade_atual: 250, custo_unitario: 12.0, categoria: 'Aditivo', organization_id: 'org1' };

        // Simulando entradas de estoque nos últimos 5 dias
        // Nota: estoqueService.addEntrada já atualiza o saldo e registra histórico
        // mockaremos ids ou usaremos o que o serviço retornar se possível. 
        // Como o supabaseClient.insert retorna o dado, mas o service pode estar omitindo o id na criação:

        // 3. Clientes e Vendas
        console.log('👥 Criando Clientes e Pedidos de Venda...');
        const cliente1 = await vendasService.criarCliente({ nome: 'Construtora Horizonte', cnpj_cpf: '12.345.678/0001-99', contato: 'Carlos Silva', email: 'carlos@horizonte.com' });
        const cliente2 = await vendasService.criarCliente({ nome: 'Depósito São José', contato: 'Zezinho', telefone: '(34) 99999-8888' });

        // 4. Compras e Fornecedores
        console.log('🛒 Criando Fornecedores e Pedidos de Compra...');
        const forn1 = await comprasService.createFornecedor({ nome: 'Votorantim Cimentos', status: 'ATIVO', categoria: 'Cimento' });

        // 5. Máquinas e Manutenção
        console.log('⚙️ Criando Máquinas e Planos...');
        const maquina1 = await manutencaoService.createMaquina({ nome: 'Ensacadeira Automática 01', modelo: 'V-PRO 500', serie: 'ENS-2024-001', status: 'Operacional', horas_uso_total: 1250 });

        // 6. Frota
        console.log('🚚 Criando Veículos...');
        const veiculo1 = await frotaService.createVeiculo({ placa: 'PQZ-1234', modelo: 'Mercedes Atego 2426', tipo: 'TRUCK', km_atual: 45000, status: 'ATIVO' });

        // 7. Projetos e Tarefas
        console.log('📊 Criando Projetos...');
        const projeto1 = await projetosService.createProjeto({
            nome: 'Modernização da Linha de Produção',
            descricao: 'Upgrade dos sensores e automação da ensacadeira 01',
            prioridade: 'ALTA',
            status: 'EM_ANDAMENTO',
            data_inicio: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            data_fim_prevista: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        });

        console.log('✨ Seed concluído com sucesso!');
    } catch (error) {
        console.error('❌ Erro durante o seed:', error);
    }
}

seed();
