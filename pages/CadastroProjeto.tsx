import React, { useState, useEffect } from 'react';
import { FolderKanban, Plus, Save, X, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projetosService } from '../services/projetosService';
import { segurancaService } from '../services/segurancaService';
import { Projeto, StatusProjeto, Prioridade } from '../types_projetos';
import { Usuario } from '../types_seguranca';

const CadastroProjeto: React.FC = () => {
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [formData, setFormData] = useState<Partial<Projeto>>({
        nome: '',
        descricao: '',
        responsavel_id: '',
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim_prevista: '',
        status: 'PLANEJAMENTO',
        prioridade: 'MEDIA',
        orcamento: 0
    });

    useEffect(() => {
        loadUsuarios();
    }, []);

    const loadUsuarios = async () => {
        try {
            const data = await segurancaService.getUsuarios();
            setUsuarios(data.filter(u => u.ativo));
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.nome || !formData.data_inicio || !formData.data_fim_prevista) {
                alert('Preencha os campos obrigatórios');
                return;
            }

            await projetosService.createProjeto(formData as any);
            navigate('/projetos/dashboard');
        } catch (error: any) {
            alert(`Erro ao criar projeto: ${error.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FolderKanban className="text-teal-600" />
                        Novo Projeto
                    </h1>
                    <p className="text-slate-500">Cadastre um novo projeto</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Projeto *</label>
                        <input
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            placeholder="Ex: Implementação do Sistema ERP"
                            required
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                        <textarea
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 h-24"
                            placeholder="Descreva o objetivo e escopo do projeto..."
                            value={formData.descricao}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                            <User size={16} className="text-slate-400" />
                            Responsável
                        </label>
                        <select
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            value={formData.responsavel_id}
                            onChange={(e) => setFormData({ ...formData, responsavel_id: e.target.value })}
                        >
                            <option value="">Selecione...</option>
                            {usuarios.map(u => (
                                <option key={u.id} value={u.id}>{u.nome}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                        <select
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusProjeto })}
                        >
                            <option value="PLANEJAMENTO">Planejamento</option>
                            <option value="EM_ANDAMENTO">Em Andamento</option>
                            <option value="PAUSADO">Pausado</option>
                            <option value="CONCLUIDO">Concluído</option>
                            <option value="CANCELADO">Cancelado</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Prioridade</label>
                        <select
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            value={formData.prioridade}
                            onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as Prioridade })}
                        >
                            <option value="BAIXA">Baixa</option>
                            <option value="MEDIA">Média</option>
                            <option value="ALTA">Alta</option>
                            <option value="URGENTE">Urgente</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" />
                            Data de Início *
                        </label>
                        <input
                            type="date"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                            value={formData.data_inicio}
                            onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" />
                            Data de Término Prevista *
                        </label>
                        <input
                            type="date"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                            value={formData.data_fim_prevista}
                            onChange={(e) => setFormData({ ...formData, data_fim_prevista: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Orçamento (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            placeholder="0,00"
                            value={formData.orcamento}
                            onChange={(e) => setFormData({ ...formData, orcamento: parseFloat(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => navigate('/projetos/dashboard')}
                        className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-2 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-700 flex items-center gap-2"
                    >
                        <Save size={18} />
                        Salvar Projeto
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CadastroProjeto;
