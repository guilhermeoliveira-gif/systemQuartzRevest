import React, { useState, useEffect } from 'react';
import { Wrench, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { frotaService } from '../../services/frotaService';
import { Manutencao, Veiculo } from '../../types_frota';

type ManutencaoComVeiculo = Manutencao & { veiculo?: Veiculo };

const FrotaManutencoes: React.FC = () => {
    const [manutencoes, setManutencoes] = useState<ManutencaoComVeiculo[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await frotaService.getAllManutencoes();
            setManutencoes(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = manutencoes.filter(m =>
        (m.veiculo?.placa || '').toLowerCase().includes(filter.toLowerCase()) ||
        (m.oficina || '').toLowerCase().includes(filter.toLowerCase()) ||
        (m.descricao || '').toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Wrench className="text-orange-600" />
                Histórico de Manutenções
            </h1>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por placa, descrição ou oficina..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="p-4">Data</th>
                            <th className="p-4">Veículo</th>
                            <th className="p-4">KM</th>
                            <th className="p-4">Tipo</th>
                            <th className="p-4">Descrição</th>
                            <th className="p-4">Custo</th>
                            <th className="p-4">Oficina</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(man => (
                            <tr key={man.id} className="hover:bg-slate-50">
                                <td className="p-4 font-mono text-slate-500">{new Date(man.data).toLocaleDateString()}</td>
                                <td className="p-4 font-bold text-slate-800">{man.veiculo?.placa || '-'}</td>
                                <td className="p-4 font-mono">{man.km.toLocaleString()}</td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${man.tipo_manutencao === 'CORRETIVA' ? 'bg-red-100 text-red-700' :
                                            man.tipo_manutencao === 'PREDITIVA' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {man.tipo_manutencao === 'CORRETIVA' ? <AlertCircle size={10} /> : <CheckCircle size={10} />}
                                        {man.tipo_manutencao}
                                    </span>
                                </td>
                                <td className="p-4 max-w-xs truncate" title={man.descricao}>{man.descricao}</td>
                                <td className="p-4 font-medium text-slate-700">R$ {(man.custo || 0).toFixed(2)}</td>
                                <td className="p-4 text-slate-500">{man.oficina || '-'}</td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-400">Nenhum registro encontrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FrotaManutencoes;
