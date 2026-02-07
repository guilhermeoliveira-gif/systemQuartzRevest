import React, { useState, useEffect } from 'react';
import { ListTodo, Save } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { projetosService } from '../services/projetosService';
import { segurancaService } from '../services/segurancaService';
import { TarefaProjeto, StatusTarefa, Prioridade, Projeto } from '../types_projetos';
import { Usuario } from '../types_seguranca';

const CadastroTarefa: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const projetoIdParam = searchParams.get('projeto_id');

    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [formData, setFormData] = useState<Partial<TarefaProjeto>>({
        projeto_id: projetoIdParam || '',
        titulo: '',
        descricao: '',
        responsavel_id: '',
        data_fim_prevista: '',
        status: 'PENDENTE',
        prioridade: 'MEDIA',
        horas_estimadas: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [projetosData, usuariosData] = await Promise.all([
                projetosService.getProjetos(),
                segurancaService.getUsuarios()
            ]);
            setProjetos(projetosData.filter(p => p.status !== 'CONCLUIDO' && p.status !== 'CANCELADO'));
            setUsuarios(usuariosData.filter(u => u.ativo));
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.projeto_id || !formData.titulo || !formData.data_fim_prevista) {
                alert('Preencha os campos obrigatórios');
                return;
            }

            await projetosService.createTarefa(formData as any);
            navigate('/projetos/tarefas');
        } catch (error: any) {
            alert(`Erro ao criar tarefa: ${error.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <ListTodo className="text-teal-600" />
                    Nova Tarefa
                </h1>
                <p className="text-slate-500">Cadastre uma nova tarefa do projeto</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Projeto *</label>
                        <select
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                            value={formData.projeto_id}
                            onChange={(e) => setFormData({ ...formData, projeto_id: e.target.value })}
                        >
                            <option value="">Selecione o projeto...</option>
                            {projetos.map(p => (
                                <option key={p.id} value={p.id}>{p.nome}</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Título da Tarefa *</label>
                        <input
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            placeholder="Ex: Configurar servidor de produção"
                            required
                            value={formData.titulo}
                            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                        <textarea
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 h-20"
                            placeholder="Detalhes da tarefa..."
                            value={formData.descricao}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Responsável</label>
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
                        <label className="block text-sm font-bold text-slate-700 mb-1">Prazo *</label>
                        <input
                            type="date"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            required
                            value={formData.data_fim_prevista}
                            onChange={(e) => setFormData({ ...formData, data_fim_prevista: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                        <select
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusTarefa })}
                        >
                            <option value="PENDENTE">Pendente</option>
                            <option value="EM_ANDAMENTO">Em Andamento</option>
                            <option value="BLOQUEADA">Bloqueada</option>
                            <option value="CONCLUIDA">Concluída</option>
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
                        <label className="block text-sm font-bold text-slate-700 mb-1">Horas Estimadas</label>
                        <input
                            type="number"
                            step="0.5"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                            placeholder="0"
                            value={formData.horas_estimadas}
                            onChange={(e) => setFormData({ ...formData, horas_estimadas: parseFloat(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-8 mt-8 border-t">
                    <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button type="submit" className="px-8 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 flex items-center gap-2">
                        <Save size={18} />
                        Salvar Tarefa
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CadastroTarefa;
