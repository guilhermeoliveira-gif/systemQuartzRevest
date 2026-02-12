import { supabase } from './supabaseClient';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

export interface ResultadoBusca {
    id: string;
    tipo: 'NC' | 'PROJETO' | 'TAREFA' | 'MATERIAL' | 'USUARIO';
    titulo: string;
    subtitulo?: string;
    link: string;
    metadata?: Record<string, any>;
}

export const buscaService = {
    async buscarGlobal(query: string): Promise<ResultadoBusca[]> {
        if (!query || query.length < 2) return [];

        const resultados: ResultadoBusca[] = [];

        try {
            // Buscar em Não Conformidades
            const ncs = await prisma.nao_conformidade.findMany({
                where: {
                    OR: [
                        { titulo: { contains: query, mode: 'insensitive' } },
                        { descricao: { contains: query, mode: 'insensitive' } }
                    ]
                },
                select: { id: true, titulo: true, descricao: true, status: true },
                take: 5
            });

            resultados.push(...ncs.map(nc => ({
                id: nc.id,
                tipo: 'NC' as const,
                titulo: nc.titulo,
                subtitulo: `Status: ${nc.status}`,
                link: `/qualidade/nao-conformidades`,
                metadata: { status: nc.status }
            })));

            // Buscar em Projetos
            const projetos = await prisma.projeto.findMany({
                where: {
                    OR: [
                        { nome: { contains: query, mode: 'insensitive' } },
                        { descricao: { contains: query, mode: 'insensitive' } }
                    ]
                },
                select: { id: true, nome: true, descricao: true, status: true },
                take: 5
            });

            resultados.push(...projetos.map(p => ({
                id: p.id,
                tipo: 'PROJETO' as const,
                titulo: p.nome,
                subtitulo: `Status: ${p.status}`,
                link: `/projetos/dashboard`,
                metadata: { status: p.status }
            })));

            // Buscar em Tarefas (View Unificada - Mantido Supabase por falta de mapping no Prisma)
            const { data: tarefas } = await supabase
                .from('tarefas_unificadas')
                .select('id, titulo, descricao, origem, status, link')
                .or(`titulo.ilike.%${query}%,descricao.ilike.%${query}%`)
                .limit(5);

            if (tarefas) {
                resultados.push(...tarefas.map(t => ({
                    id: t.id,
                    tipo: 'TAREFA' as const,
                    titulo: t.titulo,
                    subtitulo: `${t.origem} - ${t.status}`,
                    link: t.link,
                    metadata: { origem: t.origem, status: t.status }
                })));
            }

            // Buscar em Matérias-Primas
            const mps = await prisma.materia_prima.findMany({
                where: {
                    OR: [
                        { nome: { contains: query, mode: 'insensitive' } }
                        // Nota: campo 'codigo' não encontrado no schema.prisma para materia_prima. 
                        // O subtitulo legando usava mp.codigo. Vou remover ou ajustar se encontrar o campo real.
                    ]
                },
                select: { id: true, nome: true, categoria: true },
                take: 5
            });

            resultados.push(...mps.map(mp => ({
                id: mp.id,
                tipo: 'MATERIAL' as const,
                titulo: mp.nome,
                subtitulo: `${mp.categoria}`,
                link: `/estoque/mp`,
                metadata: { categoria: mp.categoria }
            })));

            // Buscar em Usuários
            const usuarios = await prisma.usuarios.findMany({
                where: {
                    OR: [
                        { nome: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } }
                    ]
                },
                select: { id: true, nome: true, email: true, perfil_id: true },
                take: 5
            });

            resultados.push(...usuarios.map(u => ({
                id: u.id,
                tipo: 'USUARIO' as const,
                titulo: u.nome || 'Sem Nome',
                subtitulo: u.email,
                link: `/seguranca/usuarios`,
                metadata: { email: u.email }
            })));

            return resultados;
        } catch (error) {
            logger.error('Erro na busca global:', error);
            return [];
        }
    }
};
