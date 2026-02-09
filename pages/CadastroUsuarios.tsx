import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Shield, Phone, Mail, Save, X } from 'lucide-react';
import { segurancaService } from '../services/segurancaService';
import { Usuario, UsuarioCreate, Perfil } from '../types_seguranca';

const CadastroUsuarios: React.FC = () => {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [perfis, setPerfis] = useState<Perfil[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState<Partial<UsuarioCreate>>({
        email: '',
        password: '',
        nome: '',
        telefone: '',
        perfil_id: '',
        cargo: '',
        setor: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usuariosData, perfisData] = await Promise.all([
                segurancaService.getUsuarios(),
                segurancaService.getPerfis()
            ]);
            setUsuarios(usuariosData);
            setPerfis(perfisData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const [editingId, setEditingId] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.nome) {
                alert('O nome é obrigatório');
                return;
            }

            if (editingId) {
                // Update
                const updates: Partial<Usuario> = {
                    nome: formData.nome,
                    telefone: formData.telefone,
                    perfil_id: formData.perfil_id,
                    cargo: formData.cargo,
                    setor: formData.setor
                };

                // Only update password if provided (for security/simplicity in this context)
                // Note: Updating password via Supabase Auth usually requires a separate call or admin API. 
                // For now, we focus on profile data or assume service handles it if possible.
                // The service `segurancaService.updateUsuario` updates the `usuarios` table.

                await segurancaService.updateUsuario(editingId, updates);
                alert('Usuário atualizado com sucesso!');
            } else {
                // Create
                if (!formData.email || !formData.password) {
                    alert('E-mail e senha são obrigatórios para novos usuários');
                    return;
                }
                await segurancaService.createUsuario(formData as UsuarioCreate);
                alert('Usuário criado com sucesso!');
            }

            await loadData();
            setShowForm(false);
            resetForm();
        } catch (error: any) {
            console.error('Erro ao salvar usuário:', error);
            alert(`Erro ao salvar usuário: ${error.message}`);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            email: '',
            password: '',
            nome: '',
            telefone: '',
            perfil_id: '',
            cargo: '',
            setor: ''
        });
    };

    const handleEdit = (usuario: Usuario) => {
        setEditingId(usuario.id);
        setFormData({
            email: usuario.email,
            password: '', // Password is not retrieving for security
            nome: usuario.nome,
            telefone: usuario.telefone || '',
            perfil_id: usuario.perfil_id || '',
            cargo: usuario.cargo || '',
            setor: usuario.setor || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente desativar este usuário?')) return;

        try {
            await segurancaService.deleteUsuario(id);
            await loadData();
        } catch (error) {
            console.error('Erro ao desativar usuário:', error);
        }
    };

    const filteredUsuarios = usuarios.filter(u =>
        u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Carregando usuários...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="text-purple-600" />
                        Cadastro de Usuários
                    </h1>
                    <p className="text-slate-500">Gerencie os usuários do sistema</p>
                </div>
            </header>

            {/* Controls */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Buscar usuário..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition shadow-sm font-medium"
                >
                    <Plus size={20} />
                    Novo Usuário
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-purple-50 px-8 py-6 border-b border-purple-100 flex justify-between items-center sticky top-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    {editingId ? <Edit2 className="text-purple-600" /> : <Plus className="text-purple-600" />}
                                    {editingId ? 'Editar Usuário' : 'Novo Usuário'}
                                </h2>
                                <p className="text-slate-500 text-sm mt-1">{editingId ? 'Atualize os dados do usuário' : 'Preencha os dados do novo usuário'}</p>
                            </div>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 transition">
                                <X size={28} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo *</label>
                                    <input
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Ex: João Silva"
                                        required
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                                        <Mail size={16} className="text-slate-400" />
                                        E-mail {editingId ? '(Não editável)' : '*'}
                                    </label>
                                    <input
                                        type="email"
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${editingId ? 'bg-slate-100 text-slate-500' : ''}`}
                                        placeholder="usuario@empresa.com"
                                        required={!editingId}
                                        disabled={!!editingId}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                                        <Phone size={16} className="text-slate-400" />
                                        Telefone
                                    </label>
                                    <input
                                        type="tel"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="(00) 00000-0000"
                                        value={formData.telefone}
                                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Senha *</label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                        minLength={6}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                                        <Shield size={16} className="text-slate-400" />
                                        Perfil
                                    </label>
                                    <select
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                        value={formData.perfil_id}
                                        onChange={(e) => setFormData({ ...formData, perfil_id: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {perfis.filter(p => p.ativo).map(perfil => (
                                            <option key={perfil.id} value={perfil.id}>{perfil.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Cargo</label>
                                    <input
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Ex: Analista"
                                        value={formData.cargo}
                                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Setor</label>
                                    <input
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Ex: Qualidade"
                                        value={formData.setor}
                                        onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-2 bg-purple-600 text-white font-bold rounded-lg shadow-md hover:bg-purple-700 flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    Salvar Usuário
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* User List */}
            <div className="grid gap-4">
                {filteredUsuarios.map(usuario => (
                    <div key={usuario.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-lg text-slate-800">{usuario.nome}</h3>
                                    {!usuario.ativo && (
                                        <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-bold">
                                            INATIVO
                                        </span>
                                    )}
                                    {usuario.perfil && (
                                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                            <Shield size={12} />
                                            {usuario.perfil.nome}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} className="text-slate-400" />
                                        <span>{usuario.email}</span>
                                    </div>
                                    {usuario.telefone && (
                                        <div className="flex items-center gap-2">
                                            <Phone size={14} className="text-slate-400" />
                                            <span>{usuario.telefone}</span>
                                        </div>
                                    )}
                                    {usuario.cargo && (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-700">{usuario.cargo}</span>
                                            {usuario.setor && <span className="text-slate-400">• {usuario.setor}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(usuario)}
                                    className="text-slate-400 hover:text-blue-500 p-2 rounded hover:bg-blue-50 transition"
                                    title="Editar usuário"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(usuario.id)}
                                    className="text-slate-400 hover:text-red-500 p-2 rounded hover:bg-red-50 transition"
                                    title="Desativar usuário"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredUsuarios.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                        <Users size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500 font-medium">Nenhum usuário encontrado</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CadastroUsuarios;
