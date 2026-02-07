// Types para Módulo de Segurança

export interface Perfil {
    id: string;
    nome: string;
    descricao?: string;
    ativo: boolean;
    created_at: string;
    updated_at?: string;
}

export interface Funcionalidade {
    id: string;
    modulo: string;
    nome: string;
    descricao?: string;
    created_at: string;
}

export interface Permissao {
    id: string;
    perfil_id: string;
    funcionalidade_id: string;
    pode_visualizar: boolean;
    pode_criar: boolean;
    pode_editar: boolean;
    pode_excluir: boolean;
    created_at: string;

    // Joins opcionais
    perfil?: Perfil;
    funcionalidade?: Funcionalidade;
}

export interface Usuario {
    id: string;
    email: string;
    nome: string;
    telefone?: string;
    perfil_id?: string;
    cargo?: string;
    setor?: string;
    avatar_url?: string;
    ativo: boolean;
    created_at: string;
    updated_at?: string;

    // Join opcional
    perfil?: Perfil;
}

export interface UsuarioCreate {
    email: string;
    password: string;
    nome: string;
    telefone?: string;
    perfil_id?: string;
    cargo?: string;
    setor?: string;
}
