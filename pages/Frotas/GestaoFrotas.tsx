import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, MapPin, Gauge, Fuel, AlertCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { frotaService } from '../../services/frotaService';
import { Veiculo, TipoVeiculo, StatusVeiculo } from '../../types_frota';

const GestaoFrotas: React.FC = () => {
    const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Novo Veículo State
    const [newItem, setNewItem] = useState<Partial<Veiculo>>({
        placa: '',
        marca: '',
        modelo: '',
        tipo: 'TRUCK',
        ano: new Date().getFullYear(),
        km_atual: 0,
        status: 'ATIVO' as StatusVeiculo
    });

    useEffect(() => {
        loadVeiculos();
    }, []);

    const loadVeiculos = async () => {
        try {
            const data = await frotaService.getVeiculos();
            setVeiculos(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await frotaService.createVeiculo(newItem as any);
            setIsModalOpen(false);
            setNewItem({
                placa: '', marca: '', modelo: '', tipo: 'TRUCK',
                ano: new Date().getFullYear(), km_atual: 0, status: 'ATIVO' as StatusVeiculo
            });
            loadVeiculos();
        } catch (error: any) {
            console.error('Erro detalhado ao salvar veículo:', error);
            const errorMessage = error.details || error.message || 'Erro desconhecido ao cadastrar veículo no Supabase.';
            alert(`Erro ao salvar veículo: ${errorMessage}`);
        }
    };

    const filteredVeiculos = veiculos.filter(v =>
        v.placa.toLowerCase().includes(filter.toLowerCase()) ||
        v.modelo.toLowerCase().includes(filter.toLowerCase())
    );

    const getTipoIcon = (tipo: TipoVeiculo) => {
        switch (tipo) {
            case 'MOTO': return <span className="text-2xl">🏍️</span>;
            case 'CARRO': return <span className="text-2xl">🚗</span>;
            case 'TOCO': return <span className="text-2xl">🚚</span>;
            case 'TRUCK': return <span className="text-2xl">🚛</span>;
            case 'CAVALO': return <span className="text-2xl">🚜</span>; // Representação
            case 'CARRETA': return <span className="text-2xl">🚛</span>;
            default: return <Truck />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Truck className="text-blue-600" />
                        Gestão de Frota
                    </h1>
                    <p className="text-slate-500">Controle de veículos, abastecimentos e manutenções</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    Novo Veículo
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por placa ou modelo..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-400">Carregando frota...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVeiculos.map(veiculo => (
                        <Link
                            to={`/frotas/${veiculo.id}`}
                            key={veiculo.id}
                            className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow block relative group"
                        >
                            <div className={`absolute top-0 left-0 w-1 h-full ${veiculo.status === 'ATIVO' ? 'bg-green-500' : 'bg-red-500'}`} />

                            <div className="flex justify-between items-start mb-4 pl-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-slate-100 rounded-lg">
                                        {getTipoIcon(veiculo.tipo)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">{veiculo.placa}</h3>
                                        <p className="text-sm text-slate-500">{veiculo.modelo} • {veiculo.ano}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${veiculo.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {veiculo.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pl-2 mt-4 pt-4 border-t border-slate-100">
                                <div>
                                    <span className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1">
                                        <Gauge size={12} /> Odômetro
                                    </span>
                                    <span className="font-mono text-lg text-slate-700 font-medium">
                                        {veiculo.km_atual.toLocaleString()} <span className="text-sm">km</span>
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-500 uppercase font-bold">Tipo</span>
                                    <span className="block font-medium text-slate-700">{veiculo.tipo}</span>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {filteredVeiculos.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <Truck className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                            <p className="text-slate-500">Nenhum veículo encontrado.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Novo Veículo */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95">
                        <h3 className="text-xl font-bold mb-4 text-slate-800">Cadastrar Novo Veículo</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Placa</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 border rounded-lg uppercase"
                                    placeholder="AAA-0000"
                                    value={newItem.placa}
                                    onChange={e => setNewItem({ ...newItem, placa: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                                    <input
                                        className="w-full px-3 py-2 border rounded-lg"
                                        placeholder="Mercedes"
                                        value={newItem.marca}
                                        onChange={e => setNewItem({ ...newItem, marca: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                                    <input
                                        required
                                        className="w-full px-3 py-2 border rounded-lg"
                                        placeholder="Axor 2544"
                                        value={newItem.modelo}
                                        onChange={e => setNewItem({ ...newItem, modelo: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-lg bg-white"
                                        value={newItem.tipo}
                                        onChange={e => setNewItem({ ...newItem, tipo: e.target.value as TipoVeiculo })}
                                    >
                                        <option value="CARRO">Carro</option>
                                        <option value="MOTO">Moto</option>
                                        <option value="TOCO">Toco</option>
                                        <option value="TRUCK">Truck</option>
                                        <option value="CAVALO">Cavalo Mecânico</option>
                                        <option value="CARRETA">Carreta</option>
                                        <option value="OUTRO">Outro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Ano</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border rounded-lg"
                                        value={newItem.ano}
                                        onChange={e => setNewItem({ ...newItem, ano: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">KM Inicial</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={newItem.km_atual}
                                    onChange={e => setNewItem({ ...newItem, km_atual: Number(e.target.value) })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    Salvar Veículo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestaoFrotas;
