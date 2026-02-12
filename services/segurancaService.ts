import { prisma } from '../lib/prisma';
import { Perfil, Funcionalidade, Permissao, Usuario, UsuarioCreate } from '../types_seguranca';

export const segurancaService = {
    // ==================== PERFIS ====================

    async getPerfis(): Promise<Perfil[]> {
        return await prisma.perfil.findMany({
            orderBy: { nome: 'asc' }
        }) as unknown as Perfil[];
    },

    async createPerfil(perfil: Omit<Perfil, 'id' | 'created_at' | 'updated_at'>): Promise<Perfil> {
        return await prisma.perfil.create({
            data: perfil as any
        }) as unknown as Perfil;
    },

    async updatePerfil(id: string, updates: Partial<Perfil>): Promise<Perfil> {
        return await prisma.perfil.update({
            where: { id },
            data: { ...updates, updated_at: new Date() }
        }) as unknown as Perfil;
    },

    async deletePerfil(id: string): Promise<void> {
        await prisma.perfil.delete({
            where: { id }
        });
    },

    // ==================== FUNCIONALIDADES ====================

    async getFuncionalidades(): Promise<Funcionalidade[]> {
        // Assuming 'funcionalidade' model exists or is accessible
        // If not in introspection, we might need a raw query or check naming
        return await (prisma as any).funcionalidade.findMany({
            orderBy: [
                { modulo: 'asc' },
                { nome: 'asc' }
            ]
        }) as unknown as Funcionalidade[];
    },

    // ==================== PERMISSÕES ====================

    async getPermissoesByPerfil(perfilId: string): Promise<Permissao[]> {
        return await (prisma as any).permissao.findMany({
            where: { perfil_id: perfilId },
            include: {
                funcionalidade: true
            }
        }) as unknown as Permissao[];
    },

    async upsertPermissao(permissao: Omit<Permissao, 'id' | 'created_at'>): Promise<Permissao> {
        return await (prisma as any).permissao.upsert({
            where: {
                perfil_id_funcionalidade_id: {
                    perfil_id: permissao.perfil_id,
                    funcionalidade_id: permissao.funcionalidade_id
                }
            },
            update: permissao as any,
            create: permissao as any
        }) as unknown as Permissao;
    },

    async deletePermissao(id: string): Promise<void> {
        await (prisma as any).permissao.delete({
            where: { id }
        });
    },

    // ==================== USUÁRIOS ====================

    // Cache simples para usuários
    _usuariosCache: null as Usuario[] | null,
    _usuariosCacheTime: 0,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutos

    async getUsuarios(forceRefresh = false): Promise<Usuario[]> {
        const now = Date.now();
        if (!forceRefresh && this._usuariosCache && (now - this._usuariosCacheTime < this.CACHE_DURATION)) {
            return this._usuariosCache;
        }

        const usuariosList = await prisma.usuarios.findMany({
            include: {
                perfil: true
            },
            orderBy: { nome: 'asc' }
        }) as unknown as Usuario[];

        console.log(`segurancaService.getUsuarios: ${usuariosList.length} usuários encontrados`);

        this._usuariosCache = usuariosList;
        this._usuariosCacheTime = now;
        return this._usuariosCache;
    },

    async createUsuario(usuario: UsuarioCreate): Promise<Usuario> {
        // Since we are moving away from direct Supabase Auth in this service
        // and Prisma doesn't handle Auth, we only update the table.
        // In a real scenario, Auth should be handled by a dedicated Auth provider/service.
        console.warn('createUsuario: Prisma migration - Auth sign-up not performed. Updating usuarios table only.');

        return await prisma.usuarios.create({
            data: {
                id: (usuario as any).id || crypto.randomUUID(), // Assuming ID is provided or generated
                email: usuario.email,
                nome: usuario.nome,
                telefone: usuario.telefone,
                perfil_id: usuario.perfil_id,
                cargo: usuario.cargo,
                setor: usuario.setor,
                ativo: true
            }
        }) as unknown as Usuario;
    },

    async updateUsuario(id: string, updates: Partial<Usuario>): Promise<Usuario> {
        return await prisma.usuarios.update({
            where: { id },
            data: { ...updates as any, updated_at: new Date() }
        }) as unknown as Usuario;
    },

    async deleteUsuario(id: string): Promise<void> {
        // Desativar ao invés de deletar
        await this.updateUsuario(id, { ativo: false });
    }
};
