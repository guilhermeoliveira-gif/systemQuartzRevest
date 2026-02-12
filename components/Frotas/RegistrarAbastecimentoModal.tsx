import React, { useState, useEffect } from 'react';
import { Fuel, X } from 'lucide-react';
import { frotaService } from '../../services/frotaService';
import { Abastecimento, Veiculo } from '../../types_frota';

interface RegistrarAbastecimentoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    veiculoId?: string; // Opcional, se já soubermos o veículo
}

export const RegistrarAbastecimentoModal: React.FC<RegistrarAbastecimentoModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    veiculoId
}) => {
    const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Abastecimento>>({
        veiculo_id: veiculoId || '',
        data: new Date().toISOString().split('T')[0],
        km: 0,
        litros: 0,
        valor_total: 0,
        posto: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadVeiculos();
        }
    }, [isOpen]);

    useEffect(() => {
        if (veiculoId) {
            setFormData(prev => ({ ...prev, veiculo_id: veiculoId }));
        }
    }, [veiculoId]);

    const loadVeiculos = async () => {
        try {
            const data = await frotaService.getVeiculos();
            const ativos = data.filter(v => v.status === 'ATIVO');
            setVeiculos(ativos);

            // Se tivermos um veiculoId, preenchemos o KM automático
            if (veiculoId || formData.veiculo_id) {
                const v = ativos.find(v => v.id === (veiculoId || formData.veiculo_id));
                if (v) {
                    setFormData(prev => ({ ...prev, km: v.km_atual }));
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.veiculo_id || !formData.km || !formData.litros) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        setIsSaving(true);
        try {
            await frotaService.registrarAbastecimento(formData as any);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            alert(`Erro ao salvar abastecimento: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const selectedVeiculo = veiculos.find(v => v.id === formData.veiculo_id);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Fuel className="text-blue-600" />
                        Registrar Abastecimento
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    {!veiculoId && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Veículo (Frota) *</label>
                            <select
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                value={formData.veiculo_id}
                                onChange={e => {
                                    const vId = e.target.value;
                                    const v = veiculos.find(v => v.id === vId);
                                    setFormData({
                                        ...formData,
                                        veiculo_id: vId,
                                        km: v ? v.km_atual : 0
                                    });
                                }}
                            >
                                <option value="">Selecione um veículo...</option>
                                {veiculos.map(v => (
                                    <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data *</label>
                            <input
                                type="date"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.data}
                                onChange={e => setFormData({ ...formData, data: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">KM Atual *</label>
                            <input
                                type="number"
                                required
                                min={selectedVeiculo?.km_atual || 0}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.km || ''}
                                onChange={e => setFormData({ ...formData, km: Number(e.target.value) })}
                            />
                            {selectedVeiculo && (
                                <p className="text-xs text-slate-400 mt-1">KM anterior: {selectedVeiculo.km_atual.toLocaleString()}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade (Litros) *</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                placeholder="0.00"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.litros || ''}
                                onChange={e => setFormData({ ...formData, litros: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Valor Total (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.valor_total || ''}
                                onChange={e => setFormData({ ...formData, valor_total: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Posto de Combustível</label>
                        <input
                            type="text"
                            placeholder="Ex: Posto Graal"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formData.posto}
                            onChange={e => setFormData({ ...formData, posto: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                            disabled={isSaving}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md transform active:scale-95 transition-all disabled:opacity-50"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Salvando...' : 'Salvar Registro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
