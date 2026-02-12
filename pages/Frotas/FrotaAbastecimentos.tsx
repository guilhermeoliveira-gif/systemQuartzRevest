import React, { useState, useEffect } from 'react';
import { Fuel, Search, Plus } from 'lucide-react';
import { frotaService } from '../../services/frotaService';
import { Abastecimento, Veiculo } from '../../types_frota';
import { RegistrarAbastecimentoModal } from '../../components/Frotas/RegistrarAbastecimentoModal';

type AbastecimentoComVeiculo = Abastecimento & { veiculo?: Veiculo };

const FrotaAbastecimentos: React.FC = () => {
    const [abastecimentos, setAbastecimentos] = useState<AbastecimentoComVeiculo[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await frotaService.getAllAbastecimentos();
            setAbastecimentos(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = abastecimentos.filter(a =>
        (a.veiculo?.placa || '').toLowerCase().includes(filter.toLowerCase()) ||
        (a.posto || '').toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Fuel className="text-blue-600" />
                    Histórico de Abastecimentos
                </h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm font-bold"
                >
                    <Plus size={20} />
                    Registrar Abastecimento
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por placa ou posto..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">Veículo</th>
                                <th className="p-4">KM</th>
                                <th className="p-4">Litros</th>
                                <th className="p-4">Posto</th>
                                <th className="p-4 text-center">R$ Valor Total</th>
                                <th className="p-4 text-center">Média (Km/L)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map(ab => (
                                <tr key={ab.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono text-slate-500">{new Date(ab.data).toLocaleDateString()}</td>
                                    <td className="p-4 font-bold text-slate-800">{ab.veiculo?.placa || '-'}</td>
                                    <td className="p-4 font-mono">{ab.km.toLocaleString()}</td>
                                    <td className="p-4">{ab.litros.toFixed(2)} L</td>
                                    <td className="p-4 text-slate-500">{ab.posto || '-'}</td>
                                    <td className="p-4 text-center text-green-700 font-medium">R$ {(ab.valor_total || 0).toFixed(2)}</td>
                                    <td className="p-4 text-center font-bold text-blue-700 bg-blue-50/20">
                                        {(ab.media_km_l || 0).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">Nenhum registro encontrado.</td>
                                </tr>
                            )}
                            {loading && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400 animate-pulse">Carregando...</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <RegistrarAbastecimentoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadData}
            />
        </div>
    );
};

export default FrotaAbastecimentos;


