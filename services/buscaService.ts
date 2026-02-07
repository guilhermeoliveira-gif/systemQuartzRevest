import { supabase } from './supabaseClient';

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
        const searchTerm = `%${query.toLowerCase()}%`;

        try {
            // Buscar em Não Conformidades
            const { data: ncs } = await supabase
                .from('nao_conformidade')
                .select('id, titulo, descricao, status')
                .or(`titulo.ilike.${searchTerm},descricao.ilike.${searchTerm}`)
                .limit(5);

            if (ncs) {
                resultados.push(...ncs.map(nc => ({
                    id: nc.id,
                    tipo: 'NC' as const,
                    titulo: nc.titulo,
                    subtitulo: `Status: ${nc.status}`,
                    link: `/qualidade/nao-conformidades`,
                    metadata: { status: nc.status }
                })));
            }

            // Buscar em Projetos
            const { data: projetos } = await supabase
                .from('projeto')
                .select('id, nome, descricao, status')
                .or(`nome.ilike.${searchTerm},descricao.ilike.${searchTerm}`)
                .limit(5);

            if (projetos) {
                resultados.push(...projetos.map(p => ({
                    id: p.id,
                    tipo: 'PROJETO' as const,
                    titulo: p.nome,
                    subtitulo: `Status: ${p.status}`,
                    link: `/projetos/dashboard`,
                    metadata: { status: p.status }
                })));
            }

            // Buscar em Tarefas (View Unificada)
            const { data: tarefas } = await supabase
                .from('tarefas_unificadas')
                .select('id, titulo, descricao, origem, status, link')
                .or(`titulo.ilike.${searchTerm},descricao.ilike.${searchTerm}`)
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
            const { data: mps } = await supabase
                .from('materia_prima')
                .select('id, nome, codigo, categoria')
                .or(`nome.ilike.${searchTerm},codigo.ilike.${searchTerm}`)
                .limit(5);

            if (mps) {
                resultados.push(...mps.map(mp => ({
                    id: mp.id,
                    tipo: 'MATERIAL' as const,
                    titulo: mp.nome,
                    subtitulo: `Código: ${mp.codigo} - ${mp.categoria}`,
                    link: `/estoque/mp`,
                    metadata: { codigo: mp.codigo, categoria: mp.categoria }
                })));
            }

            // Buscar em Usuários
            const { data: usuarios } = await supabase
                .from('usuarios')
                .select('id, nome, email, perfil_id')
                .or(`nome.ilike.${searchTerm},email.ilike.${searchTerm}`)
                .limit(5);

            if (usuarios) {
                resultados.push(...usuarios.map(u => ({
                    id: u.id,
                    tipo: 'USUARIO' as const,
                    titulo: u.nome,
                    subtitulo: u.email,
                    link: `/seguranca/usuarios`,
                    metadata: { email: u.email }
                })));
            }

            return resultados;
        } catch (error) {
            console.error('Erro na busca global:', error);
            return [];
        }
    }
};
