import React, { useState, useEffect } from 'react';
import { X, FolderKanban, Calendar, User } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../contexts/ToastContext';

interface CriarProjetoModalProps {
    ncId: string;
    ncTitulo: string;
    onClose: () => void;
    onSuccess: () => void;
}

const CriarProjetoModal: React.FC<CriarProjetoModalProps> = ({ ncId, ncTitulo, onClose, onSuccess }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        nome: `Projeto: ${ncTitulo}`,
        descricao: '',
        responsavel_id: '',
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim_prevista: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    useEffect(() => {
        loadUsuarios();
    }, []);

    const loadUsuarios = async () => {
        const { data } = await supabase.from('usuarios').select('id, nome, email').order('nome');
        if (data) setUsuarios(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.rpc('criar_projeto_de_nc', {
                p_nc_id: ncId,
                p_nome: formData.nome,
                p_descricao: formData.descricao,
                p_responsavel_id: formData.responsavel_id,
                p_data_inicio: formData.data_inicio,
                p_data_fim_prevista: formData.data_fim_prevista
            });

            if (error) throw error;

            toast.success('Projeto Criado', 'O projeto vinculado foi gerado com sucesso.');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Erro ao criar projeto:', error);
            toast.error('Erro ao Criar', 'Não foi possível gerar o projeto: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-51 px-4">
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                                <FolderKanban className="text-teal-600" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Criar Projeto</h2>
                                <p className="text-sm text-slate-500">A partir da NC: {ncTitulo}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Projeto *</label>
                            <input
                                type="text"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                            <textarea
                                value={formData.descricao}
                                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Responsável *</label>
                            <div className="relative">
                                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={formData.responsavel_id}
                                    onChange={(e) => setFormData({ ...formData, responsavel_id: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {usuarios.map(u => (
                                        <option key={u.id} value={u.id}>{u.nome}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Data Início</label>
                                <div className="relative">
                                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="date"
                                        value={formData.data_inicio}
                                        onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Prazo Previsto</label>
                                <div className="relative">
                                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="date"
                                        value={formData.data_fim_prevista}
                                        onChange={(e) => setFormData({ ...formData, data_fim_prevista: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 disabled:opacity-50"
                            >
                                {loading ? 'Criando...' : 'Criar Projeto'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default CriarProjetoModal;
