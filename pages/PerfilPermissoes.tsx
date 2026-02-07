import React, { useState, useEffect } from 'react';
import { Key, Save, Check, X } from 'lucide-react';
import { segurancaService } from '../services/segurancaService';
import { Perfil, Funcionalidade, Permissao } from '../types_seguranca';

const PerfilPermissoes: React.FC = () => {
    const [perfis, setPerfis] = useState<Perfil[]>([]);
    const [funcionalidades, setFuncionalidades] = useState<Funcionalidade[]>([]);
    const [permissoes, setPermissoes] = useState<Permissao[]>([]);
    const [selectedPerfil, setSelectedPerfil] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedPerfil) {
            loadPermissoes();
        }
    }, [selectedPerfil]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [perfisData, funcData] = await Promise.all([
                segurancaService.getPerfis(),
                segurancaService.getFuncionalidades()
            ]);
            setPerfis(perfisData.filter(p => p.ativo));
            setFuncionalidades(funcData);
            if (perfisData.length > 0) {
                setSelectedPerfil(perfisData[0].id);
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPermissoes = async () => {
        try {
            const data = await segurancaService.getPermissoesByPerfil(selectedPerfil);
            setPermissoes(data);
        } catch (error) {
            console.error('Erro ao carregar permissões:', error);
        }
    };

    const getPermissao = (funcionalidadeId: string) => {
        return permissoes.find(p => p.funcionalidade_id === funcionalidadeId);
    };

    const togglePermissao = async (funcionalidadeId: string, campo: 'pode_visualizar' | 'pode_criar' | 'pode_editar' | 'pode_excluir') => {
        const permissaoExistente = getPermissao(funcionalidadeId);

        const novaPermissao: Omit<Permissao, 'id' | 'created_at'> = {
            perfil_id: selectedPerfil,
            funcionalidade_id: funcionalidadeId,
            pode_visualizar: permissaoExistente?.pode_visualizar || false,
            pode_criar: permissaoExistente?.pode_criar || false,
            pode_editar: permissaoExistente?.pode_editar || false,
            pode_excluir: permissaoExistente?.pode_excluir || false,
            [campo]: !permissaoExistente?.[campo]
        };

        try {
            await segurancaService.upsertPermissao(novaPermissao);
            await loadPermissoes();
        } catch (error) {
            console.error('Erro ao atualizar permissão:', error);
        }
    };

    const groupedFuncionalidades = funcionalidades.reduce((acc, func) => {
        if (!acc[func.modulo]) {
            acc[func.modulo] = [];
        }
        acc[func.modulo].push(func);
        return acc;
    }, {} as Record<string, Funcionalidade[]>);

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Key className="text-purple-600" />
                    Perfil x Funcionalidade
                </h1>
                <p className="text-slate-500">Defina as permissões de acesso por perfil</p>
            </header>

            {/* Seletor de Perfil */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-2">Selecione o Perfil</label>
                <select
                    className="w-full md:w-96 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 font-medium text-lg"
                    value={selectedPerfil}
                    onChange={(e) => setSelectedPerfil(e.target.value)}
                >
                    {perfis.map(perfil => (
                        <option key={perfil.id} value={perfil.id}>{perfil.nome}</option>
                    ))}
                </select>
            </div>

            {/* Matriz de Permissões */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider sticky left-0 bg-slate-50">
                                    Funcionalidade
                                </th>
                                <th className="px-4 py-4 text-center text-xs font-bold text-slate-700 uppercase">
                                    Visualizar
                                </th>
                                <th className="px-4 py-4 text-center text-xs font-bold text-slate-700 uppercase">
                                    Criar
                                </th>
                                <th className="px-4 py-4 text-center text-xs font-bold text-slate-700 uppercase">
                                    Editar
                                </th>
                                <th className="px-4 py-4 text-center text-xs font-bold text-slate-700 uppercase">
                                    Excluir
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {Object.entries(groupedFuncionalidades).map(([modulo, funcs]: [string, Funcionalidade[]]) => (
                                <React.Fragment key={modulo}>
                                    <tr className="bg-slate-100">
                                        <td colSpan={5} className="px-6 py-3 text-sm font-bold text-slate-700 uppercase">
                                            {modulo}
                                        </td>
                                    </tr>
                                    {funcs.map(func => {
                                        const perm = getPermissao(func.id);
                                        return (
                                            <tr key={func.id} className="hover:bg-slate-50 transition">
                                                <td className="px-6 py-4 text-sm font-medium text-slate-800 sticky left-0 bg-white">
                                                    {func.descricao || func.nome}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button
                                                        onClick={() => togglePermissao(func.id, 'pode_visualizar')}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${perm?.pode_visualizar
                                                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                            }`}
                                                    >
                                                        {perm?.pode_visualizar ? <Check size={18} /> : <X size={18} />}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button
                                                        onClick={() => togglePermissao(func.id, 'pode_criar')}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${perm?.pode_criar
                                                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                            }`}
                                                    >
                                                        {perm?.pode_criar ? <Check size={18} /> : <X size={18} />}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button
                                                        onClick={() => togglePermissao(func.id, 'pode_editar')}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${perm?.pode_editar
                                                            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                            }`}
                                                    >
                                                        {perm?.pode_editar ? <Check size={18} /> : <X size={18} />}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button
                                                        onClick={() => togglePermissao(func.id, 'pode_excluir')}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${perm?.pode_excluir
                                                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                            }`}
                                                    >
                                                        {perm?.pode_excluir ? <Check size={18} /> : <X size={18} />}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PerfilPermissoes;
