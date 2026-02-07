import { supabase } from './supabaseClient';
import { Perfil, Funcionalidade, Permissao, Usuario, UsuarioCreate } from '../types_seguranca';

export const segurancaService = {
    // ==================== PERFIS ====================

    async getPerfis(): Promise<Perfil[]> {
        const { data, error } = await supabase
            .from('perfil')
            .select('*')
            .order('nome', { ascending: true });

        if (error) {
            console.error('Erro ao buscar perfis:', error);
            throw error;
        }

        return data || [];
    },

    async createPerfil(perfil: Omit<Perfil, 'id' | 'created_at' | 'updated_at'>): Promise<Perfil> {
        const { data, error } = await supabase
            .from('perfil')
            .insert([perfil])
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar perfil:', error);
            throw error;
        }

        return data;
    },

    async updatePerfil(id: string, updates: Partial<Perfil>): Promise<Perfil> {
        const { data, error } = await supabase
            .from('perfil')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar perfil:', error);
            throw error;
        }

        return data;
    },

    async deletePerfil(id: string): Promise<void> {
        const { error } = await supabase
            .from('perfil')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao deletar perfil:', error);
            throw error;
        }
    },

    // ==================== FUNCIONALIDADES ====================

    async getFuncionalidades(): Promise<Funcionalidade[]> {
        const { data, error } = await supabase
            .from('funcionalidade')
            .select('*')
            .order('modulo', { ascending: true })
            .order('nome', { ascending: true });

        if (error) {
            console.error('Erro ao buscar funcionalidades:', error);
            throw error;
        }

        return data || [];
    },

    // ==================== PERMISSÕES ====================

    async getPermissoesByPerfil(perfilId: string): Promise<Permissao[]> {
        const { data, error } = await supabase
            .from('permissao')
            .select(`
                *,
                funcionalidade:funcionalidade(*)
            `)
            .eq('perfil_id', perfilId);

        if (error) {
            console.error('Erro ao buscar permissões:', error);
            throw error;
        }

        return data as any || [];
    },

    async upsertPermissao(permissao: Omit<Permissao, 'id' | 'created_at'>): Promise<Permissao> {
        const { data, error } = await supabase
            .from('permissao')
            .upsert([permissao], {
                onConflict: 'perfil_id,funcionalidade_id',
                ignoreDuplicates: false
            })
            .select()
            .single();

        if (error) {
            console.error('Erro ao salvar permissão:', error);
            throw error;
        }

        return data;
    },

    async deletePermissao(id: string): Promise<void> {
        const { error } = await supabase
            .from('permissao')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao deletar permissão:', error);
            throw error;
        }
    },

    // ==================== USUÁRIOS ====================

    async getUsuarios(): Promise<Usuario[]> {
        const { data, error } = await supabase
            .from('usuarios')
            .select(`
                *,
                perfil:perfil(*)
            `)
            .order('nome', { ascending: true });

        if (error) {
            console.error('Erro ao buscar usuários:', error);
            throw error;
        }

        return data as any || [];
    },

    async createUsuario(usuario: UsuarioCreate): Promise<Usuario> {
        // 1. Criar usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: usuario.email,
            password: usuario.password,
            options: {
                data: {
                    nome: usuario.nome,
                    telefone: usuario.telefone,
                    perfil_id: usuario.perfil_id,
                    cargo: usuario.cargo,
                    setor: usuario.setor
                }
            }
        });

        if (authError) {
            console.error('Erro ao criar usuário no Auth:', authError);
            throw authError;
        }

        // 2. Atualizar dados adicionais na tabela usuarios (trigger já cria o registro)
        if (authData.user) {
            const { data, error } = await supabase
                .from('usuarios')
                .update({
                    nome: usuario.nome,
                    telefone: usuario.telefone,
                    perfil_id: usuario.perfil_id,
                    cargo: usuario.cargo,
                    setor: usuario.setor
                })
                .eq('id', authData.user.id)
                .select()
                .single();

            if (error) {
                console.error('Erro ao atualizar dados do usuário:', error);
                throw error;
            }

            return data;
        }

        throw new Error('Erro ao criar usuário');
    },

    async updateUsuario(id: string, updates: Partial<Usuario>): Promise<Usuario> {
        const { data, error } = await supabase
            .from('usuarios')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar usuário:', error);
            throw error;
        }

        return data;
    },

    async deleteUsuario(id: string): Promise<void> {
        // Desativar ao invés de deletar
        await this.updateUsuario(id, { ativo: false });
    }
};
