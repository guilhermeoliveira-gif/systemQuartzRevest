import React, { useState, useEffect } from 'react';
import { Shield, Plus, Save, X, Edit2, Trash2 } from 'lucide-react';
import { segurancaService } from '../services/segurancaService';
import { Perfil } from '../types_seguranca';

const CadastroPerfis: React.FC = () => {
    const [perfis, setPerfis] = useState<Perfil[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<Partial<Perfil>>({
        nome: '',
        descricao: '',
        ativo: true
    });

    useEffect(() => {
        loadPerfis();
    }, []);

    const loadPerfis = async () => {
        try {
            setLoading(true);
            const data = await segurancaService.getPerfis();
            setPerfis(data);
        } catch (error) {
            console.error('Erro ao carregar perfis:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await segurancaService.createPerfil(formData as Omit<Perfil, 'id' | 'created_at' | 'updated_at'>);
            await loadPerfis();
            setShowForm(false);
            setFormData({ nome: '', descricao: '', ativo: true });
        } catch (error: any) {
            alert(`Erro ao criar perfil: ${error.message}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir este perfil?')) return;
        try {
            await segurancaService.deletePerfil(id);
            await loadPerfis();
        } catch (error) {
            console.error('Erro ao deletar perfil:', error);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="text-purple-600" />
                        Cadastro de Perfis
                    </h1>
                    <p className="text-slate-500">Gerencie os perfis de acesso do sistema</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition shadow-sm font-medium"
                >
                    <Plus size={20} />
                    Novo Perfil
                </button>
            </header>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                        <div className="bg-purple-50 px-8 py-6 border-b border-purple-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">Novo Perfil</h2>
                            <button onClick={() => setShowForm(false)}><X size={28} className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Perfil *</label>
                                    <input
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Ex: Gerente de Produção"
                                        required
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                                    <textarea
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 h-24"
                                        placeholder="Descreva as responsabilidades deste perfil..."
                                        value={formData.descricao}
                                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-8 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 flex items-center gap-2">
                                    <Save size={18} />
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {perfis.map(perfil => (
                    <div key={perfil.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold text-lg text-slate-800">{perfil.nome}</h3>
                                    {!perfil.ativo && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-bold">INATIVO</span>}
                                </div>
                                {perfil.descricao && <p className="text-sm text-slate-600">{perfil.descricao}</p>}
                            </div>
                            <button onClick={() => handleDelete(perfil.id)} className="text-slate-400 hover:text-red-500 p-2 rounded hover:bg-red-50 transition">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CadastroPerfis;
