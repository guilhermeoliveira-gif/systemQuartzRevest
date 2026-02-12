import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { checklistService } from '../../services/checklistService';
import { ChecklistModelo, ChecklistItemModelo, TipoItemChecklist } from '../../types_checklist';
import { Plus, Trash2, Save, FileText, ListChecks } from 'lucide-react';

const ChecklistCadastro: React.FC = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [modelos, setModelos] = useState<ChecklistModelo[]>([]);
    const [selectedModelo, setSelectedModelo] = useState<ChecklistModelo | null>(null);
    const [novoItem, setNovoItem] = useState({ texto: '', tipo: 'CONFORME_NAO_CONFORME' as TipoItemChecklist });

    useEffect(() => {
        loadModelos();
    }, []);

    const loadModelos = async () => {
        try {
            setLoading(true);
            const data = await checklistService.getModelos();
            setModelos(data);
        } catch (error) {
            console.error('Erro ao carregar modelos:', error);
            showToast('Erro ao carregar modelos de checklist', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateModelo = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const nome = (form.elements.namedItem('nome') as HTMLInputElement).value;
        const area = (form.elements.namedItem('area') as HTMLInputElement).value;

        try {
            await checklistService.createModelo({
                nome,
                area,
                ativo: true,
                descricao: ''
            });
            showToast('Modelo criado com sucesso!', { type: 'success' });
            loadModelos();
            form.reset();
        } catch (error) {
            console.error(error);
            showToast('Erro ao criar modelo', { type: 'error' });
        }
    };

    const handleAddItem = async () => {
        if (!selectedModelo || !novoItem.texto) return;

        try {
            await checklistService.createItemModelo({
                modelo_id: selectedModelo.id,
                texto: novoItem.texto,
                tipo: novoItem.tipo,
                ordem: (selectedModelo.itens?.length || 0) + 1,
                obrigatorio: true
            });
            showToast('Item adicionado!', { type: 'success' });
            setNovoItem({ texto: '', tipo: 'CONFORME_NAO_CONFORME' });
            loadModelos(); // Recarregar para ver o item no modelo
        } catch (error) {
            console.error(error);
            showToast('Erro ao adicionar item', { type: 'error' });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Coluna 1: Lista e Criação de Modelos */}
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-blue-600" />
                        Novos Modelos
                    </h2>
                    <form onSubmit={handleCreateModelo} className="space-y-3">
                        <input name="nome" placeholder="Nome do Checklist" className="w-full input-field" required />
                        <input name="area" placeholder="Área (ex: Produção)" className="w-full input-field" required />
                        <button type="submit" className="w-full btn-primary flex justify-center items-center gap-2">
                            <Plus size={18} /> Criar Modelo
                        </button>
                    </form>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-3">Modelos Disponíveis</h3>
                    <div className="space-y-2">
                        {modelos.map(m => (
                            <div
                                key={m.id}
                                onClick={() => setSelectedModelo(m)}
                                className={`p-3 rounded-lg cursor-pointer border transition-colors ${selectedModelo?.id === m.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50 border-transparent'}`}
                            >
                                <div className="font-medium text-slate-800">{m.nome}</div>
                                <div className="text-xs text-slate-500">{m.area} • {m.itens?.length || 0} itens</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Coluna 2 e 3: Edição de Itens */}
            <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                {selectedModelo ? (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{selectedModelo.nome}</h2>
                                <p className="text-slate-500 text-sm">Gerenciando itens do checklist</p>
                            </div>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Ativo</span>
                        </div>

                        {/* Adicionar Item */}
                        <div className="flex gap-2 mb-6 p-4 bg-slate-50 rounded-lg">
                            <input
                                value={novoItem.texto}
                                onChange={e => setNovoItem({ ...novoItem, texto: e.target.value })}
                                placeholder="Texto do item (ex: Verificar nível de óleo)"
                                className="flex-1 input-field"
                            />
                            <select
                                value={novoItem.tipo}
                                onChange={e => setNovoItem({ ...novoItem, tipo: e.target.value as any })}
                                className="input-field w-40"
                            >
                                <option value="CONFORME_NAO_CONFORME">Sim/Não</option>
                                <option value="NUMERICO">Numérico</option>
                                <option value="TEXTO">Texto Livre</option>
                                <option value="FOTO">Foto</option>
                            </select>
                            <button onClick={handleAddItem} className="btn-secondary">
                                <Plus size={20} />
                            </button>
                        </div>

                        {/* Lista de Itens */}
                        <div className="space-y-2">
                            {selectedModelo.itens?.map((item, index) => (
                                <div key={item.id} className="flex items-center justify-between p-3 border-b hover:bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 flex items-center justify-center bg-slate-200 rounded-full text-xs font-bold text-slate-600">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium text-slate-800">{item.texto}</p>
                                            <p className="text-xs text-slate-500 uppercase">{item.tipo.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                    <button className="text-red-400 hover:text-red-600 p-2">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {(!selectedModelo.itens || selectedModelo.itens.length === 0) && (
                                <p className="text-center text-slate-400 py-8">Nenhum item adicionado ainda.</p>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <ListChecks size={48} className="mb-4 opacity-50" />
                        <p>Selecione um modelo à esquerda para editar seus itens.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChecklistCadastro;
