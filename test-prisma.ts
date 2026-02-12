import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando teste de conexão com o Banco Externo...');

    try {
        // 1. Tenta criar uma matéria-prima de teste
        const novaMateria = await prisma.materia_prima.create({
            data: {
                nome: 'Quartzo Teste Prisma',
                unidade_medida: 'KG',
                quantidade_atual: 100,
                custo_unitario: 15.50,
                categoria: 'Teste Sistema',
            },
        });

        console.log('✅ Matéria-prima criada com sucesso:', novaMateria);

        // 2. Tenta listar para confirmar a leitura
        const todasMaterias = await prisma.materia_prima.findMany({
            where: { categoria: 'Teste Sistema' }
        });

        console.log('📋 Itens de teste encontrados no banco:', todasMaterias.length);

        // 3. Limpeza (opcional - remove o teste se desejar)
        // await prisma.materia_prima.delete({ where: { id: novaMateria.id } });
        // console.log('🧹 Limpeza de teste realizada.');

    } catch (error) {
        console.error('❌ Erro no teste do Prisma:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
