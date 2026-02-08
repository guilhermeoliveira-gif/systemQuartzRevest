import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, Fuel, Wrench, Droplets, Calendar, ArrowLeft, Plus, Gauge, DollarSign, Save, Trash2, AlertTriangle } from 'lucide-react';
import { frotaService } from '../../services/frotaService';
import { Veiculo, Abastecimento, Manutencao, Servico, TipoManutencao, TipoServico } from '../../types_frota';

type Tab = 'ABASTECIMENTOS' | 'MANUTENCOES' | 'SERVICOS';

const VeiculoDetalhes: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [veiculo, setVeiculo] = useState<Veiculo | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('ABASTECIMENTOS');
    const [loading, setLoading] = useState(true);

    // Listas
    const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
    const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
    const [servicos, setServicos] = useState<Servico[]>([]);

    // Modais
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form States
    const [newAbastecimento, setNewAbastecimento] = useState<Partial<Abastecimento>>({ km: 0, litros: 0, valor_total: 0, data: new Date().toISOString().split('T')[0] });
    const [newManutencao, setNewManutencao] = useState<Partial<Manutencao>>({ km: 0, custo: 0, data: new Date().toISOString().split('T')[0], tipo_manutencao: 'PREVENTIVA' });
    const [newServico, setNewServico] = useState<Partial<Servico>>({ km: 0, custo: 0, data: new Date().toISOString().split('T')[0], tipo_servico: 'LAVAGEM' });

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        if (!id) return;
        try {
            const v = await frotaService.getVeiculoById(id);
            setVeiculo(v);

            // Pre-fill forms with current KM
            if (v) {
                const baseForm = { km: v.km_atual, data: new Date().toISOString().split('T')[0] };
                setNewAbastecimento(prev => ({ ...prev, ...baseForm }));
                setNewManutencao(prev => ({ ...prev, ...baseForm }));
                setNewServico(prev => ({ ...prev, ...baseForm }));
            }

            const [abs, man, serv] = await Promise.all([
                frotaService.getAbastecimentos(id),
                frotaService.getManutencoes(id),
                frotaService.getServicos(id)
            ]);
            setAbastecimentos(abs);
            setManutencoes(man);
            setServicos(serv);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        try {
            if (activeTab === 'ABASTECIMENTOS') {
                await frotaService.registrarAbastecimento({ ...newAbastecimento, veiculo_id: id } as any);
            } else if (activeTab === 'MANUTENCOES') {
                await frotaService.registrarManutencao({ ...newManutencao, veiculo_id: id } as any);
            } else {
                await frotaService.registrarServico({ ...newServico, veiculo_id: id } as any);
            }
            setIsAddModalOpen(false);
            loadData(); // Reload to update lists and vehicle KM
        } catch (error) {
            alert('Erro ao registrar operação');
            console.error(error);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando detalhes do veículo...</div>;
    if (!veiculo) return <div className="p-8 text-center text-red-500">Veículo não encontrado</div>;

    const Icon = {
        'ABASTECIMENTOS': Fuel,
        'MANUTENCOES': Wrench,
        'SERVICOS': Droplets
    }[activeTab];

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <button onClick={() => navigate('/frotas')} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-4 transition-colors">
                    <ArrowLeft size={20} /> Voltar para Frota
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-slate-100 rounded-xl text-4xl">
                            🚛
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">{veiculo.placa}</h1>
                            <p className="text-slate-500 font-medium">{veiculo.modelo} ({veiculo.ano}) • {veiculo.tipo}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 bg-slate-50 px-6 py-3 rounded-lg border border-slate-100">
                        <div className="text-right">
                            <p className="text-xs uppercase font-bold text-slate-400 mb-1">Odômetro Atual</p>
                            <p className="text-2xl font-mono text-slate-800 font-bold">{veiculo.km_atual.toLocaleString()} <span className="text-sm text-slate-400">km</span></p>
                        </div>
                        <div className="h-10 w-px bg-slate-200" />
                        <div className="text-right">
                            <p className="text-xs uppercase font-bold text-slate-400 mb-1">Status</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${veiculo.status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {veiculo.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200">
                {(['ABASTECIMENTOS', 'MANUTENCOES', 'SERVICOS'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === tab
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab === 'ABASTECIMENTOS' && <Fuel size={18} />}
                        {tab === 'MANUTENCOES' && <Wrench size={18} />}
                        {tab === 'SERVICOS' && <Droplets size={18} />}
                        {tab === 'ABASTECIMENTOS' ? 'Abastecimentos' : tab === 'MANUTENCOES' ? 'Manuteções' : 'Serviços'}
                    </button>
                ))}
            </div>

            {/* Content Actions */}
            <div className="flex justify-end">
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-colors"
                >
                    <Plus size={20} />
                    Registrar {activeTab === 'ABASTECIMENTOS' ? 'Abastecimento' : activeTab === 'MANUTENCOES' ? 'Manutenção' : 'Serviço'}
                </button>
            </div>

            {/* List Content */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {activeTab === 'ABASTECIMENTOS' && (
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">KM</th>
                                <th className="p-4">Litros</th>
                                <th className="p-4">Valor Total</th>
                                <th className="p-4">Posto</th>
                                <th className="p-4 text-center bg-blue-50 text-blue-700">Média (Km/L)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {abastecimentos.map(ab => (
                                <tr key={ab.id} className="hover:bg-slate-50">
                                    <td className="p-4">{new Date(ab.data).toLocaleDateString()}</td>
                                    <td className="p-4 font-mono">{ab.km.toLocaleString()}</td>
                                    <td className="p-4">{ab.litros.toFixed(2)} L</td>
                                    <td className="p-4">R$ {ab.valor_total.toFixed(2)}</td>
                                    <td className="p-4 text-slate-500">{ab.posto || '-'}</td>
                                    <td className="p-4 text-center font-bold text-blue-700 bg-blue-50/30">
                                        {ab.media_km_l ? ab.media_km_l.toFixed(2) : '-'}
                                    </td>
                                </tr>
                            ))}
                            {abastecimentos.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">Nenhum abastecimento registrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                {activeTab === 'MANUTENCOES' && (
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">KM</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Descrição</th>
                                <th className="p-4">Custo</th>
                                <th className="p-4">Oficina</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {manutencoes.map(man => (
                                <tr key={man.id} className="hover:bg-slate-50">
                                    <td className="p-4">{new Date(man.data).toLocaleDateString()}</td>
                                    <td className="p-4 font-mono">{man.km.toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${man.tipo_manutencao === 'CORRETIVA' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {man.tipo_manutencao}
                                        </span>
                                    </td>
                                    <td className="p-4">{man.descricao}</td>
                                    <td className="p-4">R$ {man.custo.toFixed(2)}</td>
                                    <td className="p-4 text-slate-500">{man.oficina || '-'}</td>
                                </tr>
                            ))}
                            {manutencoes.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">Nenhuma manutenção registrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                {activeTab === 'SERVICOS' && (
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">KM</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Observações</th>
                                <th className="p-4">Custo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {servicos.map(srv => (
                                <tr key={srv.id} className="hover:bg-slate-50">
                                    <td className="p-4">{new Date(srv.data).toLocaleDateString()}</td>
                                    <td className="p-4 font-mono">{srv.km.toLocaleString()}</td>
                                    <td className="p-4 font-medium">{srv.tipo_servico}</td>
                                    <td className="p-4 text-slate-500">{srv.observacoes || '-'}</td>
                                    <td className="p-4">R$ {srv.custo.toFixed(2)}</td>
                                </tr>
                            ))}
                            {servicos.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">Nenhum serviço registrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal de Registro */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg md:max-w-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                <Icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">
                                Registrar {activeTab === 'ABASTECIMENTOS' ? 'Abastecimento' : activeTab === 'MANUTENCOES' ? 'Manutenção' : 'Serviço'}
                            </h3>
                        </div>

                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg"
                                        value={
                                            activeTab === 'ABASTECIMENTOS' ? newAbastecimento.data :
                                                activeTab === 'MANUTENCOES' ? newManutencao.data : newServico.data
                                        }
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (activeTab === 'ABASTECIMENTOS') setNewAbastecimento({ ...newAbastecimento, data: val });
                                            else if (activeTab === 'MANUTENCOES') setNewManutencao({ ...newManutencao, data: val });
                                            else setNewServico({ ...newServico, data: val });
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">KM Atual (Odômetro)</label>
                                    <input
                                        type="number"
                                        min={veiculo.km_atual} // Prevent errors
                                        required
                                        className="w-full px-3 py-2 border rounded-lg"
                                        placeholder={`Min: ${veiculo.km_atual}`}
                                        value={
                                            activeTab === 'ABASTECIMENTOS' ? (newAbastecimento.km || '') :
                                                activeTab === 'MANUTENCOES' ? (newManutencao.km || '') : (newServico.km || '')
                                        }
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            if (activeTab === 'ABASTECIMENTOS') setNewAbastecimento({ ...newAbastecimento, km: val });
                                            else if (activeTab === 'MANUTENCOES') setNewManutencao({ ...newManutencao, km: val });
                                            else setNewServico({ ...newServico, km: val });
                                        }}
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Atual: {veiculo.km_atual} km</p>
                                </div>
                            </div>

                            {/* Campos Específicos de Abastecimento */}
                            {activeTab === 'ABASTECIMENTOS' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Litros</label>
                                            <input
                                                type="number" step="0.01" required
                                                className="w-full px-3 py-2 border rounded-lg"
                                                value={newAbastecimento.litros || ''}
                                                onChange={e => setNewAbastecimento({ ...newAbastecimento, litros: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Valor Total (R$)</label>
                                            <input
                                                type="number" step="0.01" required
                                                className="w-full px-3 py-2 border rounded-lg"
                                                value={newAbastecimento.valor_total || ''}
                                                onChange={e => setNewAbastecimento({ ...newAbastecimento, valor_total: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Posto de Combustível</label>
                                        <input
                                            className="w-full px-3 py-2 border rounded-lg"
                                            value={newAbastecimento.posto || ''}
                                            onChange={e => setNewAbastecimento({ ...newAbastecimento, posto: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Campos Específicos de Manutenção */}
                            {activeTab === 'MANUTENCOES' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                            <select
                                                className="w-full px-3 py-2 border rounded-lg bg-white"
                                                value={newManutencao.tipo_manutencao}
                                                onChange={e => setNewManutencao({ ...newManutencao, tipo_manutencao: e.target.value as TipoManutencao })}
                                            >
                                                <option value="PREVENTIVA">Preventiva</option>
                                                <option value="CORRETIVA">Corretiva</option>
                                                <option value="PREDITIVA">Preditiva</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Custo (R$)</label>
                                            <input
                                                type="number" step="0.01" required
                                                className="w-full px-3 py-2 border rounded-lg"
                                                value={newManutencao.custo || ''}
                                                onChange={e => setNewManutencao({ ...newManutencao, custo: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Serviço</label>
                                        <textarea
                                            required
                                            rows={3}
                                            className="w-full px-3 py-2 border rounded-lg"
                                            value={newManutencao.descricao || ''}
                                            onChange={e => setNewManutencao({ ...newManutencao, descricao: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Oficina / Mecânico</label>
                                        <input
                                            className="w-full px-3 py-2 border rounded-lg"
                                            value={newManutencao.oficina || ''}
                                            onChange={e => setNewManutencao({ ...newManutencao, oficina: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Campos Específicos de Serviços */}
                            {activeTab === 'SERVICOS' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Serviço</label>
                                            <select
                                                className="w-full px-3 py-2 border rounded-lg bg-white"
                                                value={newServico.tipo_servico}
                                                onChange={e => setNewServico({ ...newServico, tipo_servico: e.target.value as TipoServico })}
                                            >
                                                <option value="LAVAGEM">Lavagem</option>
                                                <option value="CALIBRAGEM">Calibragem</option>
                                                <option value="PNEUS">Troca/Rodízio Pneus</option>
                                                <option value="OUTROS">Outros</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Custo (R$)</label>
                                            <input
                                                type="number" step="0.01"
                                                className="w-full px-3 py-2 border rounded-lg"
                                                value={newServico.custo || ''}
                                                onChange={e => setNewServico({ ...newServico, custo: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                                        <textarea
                                            rows={3}
                                            className="w-full px-3 py-2 border rounded-lg"
                                            value={newServico.observacoes || ''}
                                            onChange={e => setNewServico({ ...newServico, observacoes: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-2 pt-6 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md transform active:scale-95 transition-all"
                                    disabled={loading}
                                >
                                    Salvar Registro
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VeiculoDetalhes;
