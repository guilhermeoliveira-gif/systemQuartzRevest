
import React, { useState, useEffect } from 'react';
import {
    Plus, Pencil, Trash2, Search, Filter,
    ChevronRight, ChevronLeft, Package, Calendar
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge, Skeleton } from '../../components/ui/Utility';
import { Dialog, AlertDialog } from '../../components/ui/Dialog';
import { pcpService } from '../../services/pcpService';
import { ItemPlanoProducao, StatusItemProducao } from '../../types_pcp';
import { useToast } from '../../contexts/ToastContext';

const PCPPlanejamento: React.FC = () => {
    const toast = useToast();
    const [itens, setItens] = useState<ItemPlanoProducao[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals state
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        nome_produto_acabado: '',
        qtd_misturas_planejadas: 10
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const planos = await pcpService.getPlanos();
            // Para simplificar, pegamos todos os itens de todos os planos ativos
            const allItens: ItemPlanoProducao[] = [];
            planos.forEach(p => {
                if (p.itens) allItens.push(...p.itens);
            });
            setItens(allItens);
        } catch (error) {
            console.error(error);
            toast.error('Erro', 'Falha ao carregar ordens de produção.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduction = async () => {
        try {
            if (!formData.nome_produto_acabado) {
                toast.error('Campo Obrigatório', 'Selecione ou digite o nome do produto.');
                return;
            }

            // Cria um plano default se não houver um para hoje (simplificado)
            const planos = await pcpService.getPlanos();
            let planoId = planos[0]?.id;

            if (!planoId) {
                const newPlano = await pcpService.createPlano({ data_planejamento: new Date().toISOString() });
                planoId = newPlano.id;
            }

            await pcpService.createItemPlano({
                id_plano_producao: planoId,
                nome_produto_acabado: formData.nome_produto_acabado,
                qtd_misturas_planejadas: formData.qtd_misturas_planejadas,
                id_produto_acabado: '00000000-0000-0000-0000-000000000000', // Mock UUID if needed
                status: 'Aguardando',
                ordem: itens.length + 1
            });

            toast.success('Sucesso', '✅ Produção planejada com sucesso!', {
                style: { backgroundColor: '#22c55e', color: 'white' }
            });

            setIsAddOpen(false);
            setFormData({ nome_produto_acabado: '', qtd_misturas_planejadas: 10 });
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Erro', 'Falha ao salvar planejamento.');
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await pcpService.deleteItemPlano(itemToDelete);
            toast.success('Excluído', 'Ordem de produção removida.');
            setIsDeleteOpen(false);
            loadData();
        } catch (error) {
            toast.error('Erro', 'Falha ao excluir item.');
        }
    };

    const getStatusBadge = (status: StatusItemProducao) => {
        switch (status) {
            case 'Aguardando': return <Badge className="bg-gray-200 text-gray-700">Aguardando</Badge>;
            case 'Produzindo': return <Badge className="bg-green-200 text-green-800">Produzindo</Badge>;
            case 'Finalizado': return <Badge className="bg-blue-200 text-blue-800">Finalizado</Badge>;
            case 'Cancelado': return <Badge className="bg-red-200 text-red-800">Cancelado</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Planejamento da Produção</h1>
                    <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                        <Calendar size={14} />
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
                <Button
                    onClick={() => setIsAddOpen(true)}
                    className="bg-blue-800 hover:bg-blue-900 text-white"
                >
                    <Plus size={18} className="mr-2" />
                    Adicionar Produção
                </Button>
            </header>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar produto..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="text-slate-600 font-bold uppercase text-[10px] tracking-widest px-6">
                    <Filter size={14} className="mr-2" /> Filtrar
                </Button>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produto Acabado</TableHead>
                            <TableHead>Quantidade Misturas</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            itens.filter(i => i.nome_produto_acabado.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="text-blue-800 font-bold">{item.nome_produto_acabado}</TableCell>
                                    <TableCell className="text-gray-700 font-bold">{item.qtd_misturas_planejadas} un</TableCell>
                                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600">
                                                <Pencil size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                                                onClick={() => {
                                                    setItemToDelete(item.id);
                                                    setIsDeleteOpen(true);
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {!loading && itens.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Package size={40} className="text-slate-300" />
                        </div>
                        <p className="text-gray-500 font-medium">Nenhum item de produção encontrado. Adicione um novo plano para começar!</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <Dialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                title="Nova Ordem de Produção"
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Produto Acabado</label>
                        <input
                            type="text"
                            placeholder="Selecione o produto"
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-bold"
                            value={formData.nome_produto_acabado}
                            onChange={(e) => setFormData({ ...formData, nome_produto_acabado: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Quantidade de Misturas</label>
                        <input
                            type="number"
                            placeholder="Ex: 10"
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-bold"
                            value={formData.qtd_misturas_planejadas}
                            onChange={(e) => setFormData({ ...formData, qtd_misturas_planejadas: Number(e.target.value) })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddProduction} className="bg-blue-800">Salvar</Button>
                    </div>
                </div>
            </Dialog>

            <AlertDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Confirmar Exclusão"
                description="Tem certeza que deseja excluir esta ordem de produção? Esta ação não poderá ser desfeita."
                confirmText="Excluir"
            />
        </div>
    );
};

export default PCPPlanejamento;
