import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { checklistService } from '../../services/checklistService';
import { manutencaoService } from '../../services/manutencaoService';
import { ChecklistModelo, ChecklistAgendamento as IChecklistAgendamento, TipoEntidade } from '../../types_checklist';
import { Maquina } from '../../types_manutencao';
import { Calendar, User, Save, List } from 'lucide-react';

const ChecklistAgendamento: React.FC = () => {
    const { showToast } = useToast();
    const [modelos, setModelos] = useState<ChecklistModelo[]>([]);
    const [maquinas, setMaquinas] = useState<Maquina[]>([]); // Carregar só máquinas por enquanto
    const [agendamentos, setAgendamentos] = useState<IChecklistAgendamento[]>([]);

    const [novoAgendamento, setNovoAgendamento] = useState({
        modelo_id: '',
        data_agendada: new Date().toISOString().split('T')[0],
        responsavel_id: '', // Idealmente viria de uma lista de usuários
        entidade_id: '',
        tipo_entidade: 'MAQUINA' as TipoEntidade
    });

    useEffect(() => {
        loadDados();
    }, []);

    const loadDados = async () => {
        try {
            const [modelosData, maquinasData, agendamentosData] = await Promise.all([
                checklistService.getModelos(),
                manutencaoService.getMaquinas(),
                checklistService.getAgendamentos()
            ]);
            setModelos(modelosData);
            setMaquinas(maquinasData);
            setAgendamentos(agendamentosData);
        } catch (error) {
            console.error(error);
            showToast('Erro ao carregar dados', { type: 'error' });
        }
    };

    const handleAgendar = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Mock de User ID logado como responsável se vazio
            const user_id = 'c13327d0-7d72-4632-841d-384196165243'; // ID fixo para teste ou pegar do AuthContext

            await checklistService.createAgendamento({
                modelo_id: novoAgendamento.modelo_id,
                data_agendada: novoAgendamento.data_agendada,
                responsavel_id: user_id,
                entidade_id: novoAgendamento.entidade_id,
                tipo_entidade: novoAgendamento.tipo_entidade,
                status: 'PENDENTE'
            });

            showToast('Agendamento criado com sucesso!', { type: 'success' });
            loadDados();
        } catch (error) {
            console.error(error);
            showToast('Erro ao agendar checklist', { type: 'error' });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="text-blue-600" />
                Agendamento de Checklist
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Formulário de Agendamento */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="font-bold text-slate-700 mb-4">Novo Agendamento</h2>
                    <form onSubmit={handleAgendar} className="space-y-4">
                        <div>
                            <label className="label">Modelo de Checklist</label>
                            <select
                                className="input-field w-full"
                                required
                                value={novoAgendamento.modelo_id}
                                onChange={e => setNovoAgendamento({ ...novoAgendamento, modelo_id: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                {modelos.map(m => (
                                    <option key={m.id} value={m.id}>{m.nome} ({m.area})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="label">Entidade (Máquina/Veículo)</label>
                            <select
                                className="input-field w-full"
                                required
                                value={novoAgendamento.entidade_id}
                                onChange={e => setNovoAgendamento({ ...novoAgendamento, entidade_id: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                {maquinas.map(m => (
                                    <option key={m.id} value={m.id}>{m.nome} - {m.modelo}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="label">Data Prevista</label>
                            <input
                                type="date"
                                className="input-field w-full"
                                required
                                value={novoAgendamento.data_agendada}
                                onChange={e => setNovoAgendamento({ ...novoAgendamento, data_agendada: e.target.value })}
                            />
                        </div>

                        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                            <Save size={18} /> Confirmar Agendamento
                        </button>
                    </form>
                </div>

                {/* Lista de Agendamentos */}
                <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="font-bold text-slate-700 mb-4">Próximas Inspeções</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-500 text-sm border-b">
                                    <th className="p-3">Data</th>
                                    <th className="p-3">Modelo</th>
                                    <th className="p-3">Entidade</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Responsável</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agendamentos.map(ag => (
                                    <tr key={ag.id} className="border-b hover:bg-slate-50">
                                        <td className="p-3 font-mono text-sm">{ag.data_agendada}</td>
                                        <td className="p-3">{ag.modelo?.nome || 'Modelo Excluído'}</td>
                                        <td className="p-3 text-sm text-slate-600">ID: {ag.entidade_id?.slice(0, 8)}...</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${ag.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' :
                                                ag.status === 'CONCLUIDO' ? 'bg-green-100 text-green-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                {ag.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-sm flex items-center gap-1">
                                            <User size={14} /> {ag.responsavel?.nome || 'Admin'}
                                        </td>
                                    </tr>
                                ))}
                                {agendamentos.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400">Nenhum agendamento encontrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChecklistAgendamento;
