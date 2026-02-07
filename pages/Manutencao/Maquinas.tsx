
import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, Pencil, Trash2,
    ChevronLeft, Settings, Cpu, Calendar, Clock
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge, Skeleton } from '../../components/ui/Utility';
import { Dialog, AlertDialog } from '../../components/ui/Dialog';
import { manutencaoService } from '../../services/manutencaoService';
import { Maquina, StatusMaquina } from '../../types_manutencao';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

const Maquinas: React.FC = () => {
    const toast = useToast();
    const navigate = useNavigate();
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // Form
    const [formData, setFormData] = useState<Partial<Maquina>>({
        nome: '',
        modelo: '',
        serie: '',
        intervalo_manutencao_horas: 500,
        horas_uso_total: 0,
        status: 'Operacional'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await manutencaoService.getMaquinas();
            setMaquinas(data);
        } catch (error) {
            toast.error('Erro', 'Falha ao carregar máquinas.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.nome) return toast.error('Ops', 'Nome da máquina é obrigatório.');
        try {
            await manutencaoService.createMaquina(formData);
            toast.success('Sucesso', '✅ Máquina cadastrada com sucesso!');
            setIsAddOpen(false);
            setFormData({
                nome: '',
                modelo: '',
                serie: '',
                intervalo_manutencao_horas: 500,
                horas_uso_total: 0,
                status: 'Operacional'
            });
            loadData();
        } catch (error) {
            toast.error('Erro', 'Falha ao salvar máquina.');
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await manutencaoService.deleteMaquina(itemToDelete);
            toast.success('Excluído', 'Máquina removida do sistema.');
            setIsDeleteOpen(false);
            loadData();
        } catch (error) {
            toast.error('Erro', 'Falha ao excluir máquina.');
        }
    };

    const getStatusBadge = (status: StatusMaquina) => {
        switch (status) {
            case 'Operacional': return <Badge className="bg-green-100 text-green-700">Operacional</Badge>;
            case 'Em Manutenção': return <Badge className="bg-blue-100 text-blue-700">Manutenção</Badge>;
            case 'Parada': return <Badge className="bg-red-100 text-red-700">Parada</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/manutencao')}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Frota de Ativos</h1>
                        <p className="text-slate-500 text-sm font-medium">Gestão de máquinas e ensacadeiras</p>
                    </div>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="bg-blue-800 text-white">
                    <Plus size={18} className="mr-2" /> Cadastrar Máquina
                </Button>
            </header>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, modelo ou série..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-100 font-medium text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="text-slate-600 font-bold uppercase text-[10px] tracking-widest px-6">
                    <Filter size={14} className="mr-2" /> Filtrar
                </Button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Identificação</TableHead>
                            <TableHead>Modelo / Série</TableHead>
                            <TableHead>Horas Totais</TableHead>
                            <TableHead>Intervalo Prev.</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            maquinas.filter(m =>
                                m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                m.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                m.serie?.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map((m) => (
                                <TableRow key={m.id} className="cursor-pointer group" onClick={() => navigate(`/manutencao/maquinas/${m.id}`)}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                {m.nome.charAt(0)}
                                            </div>
                                            <span className="font-bold text-slate-800">{m.nome}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-500 font-medium">
                                        <span className="block">{m.modelo}</span>
                                        <span className="text-[10px] font-black opacity-40">{m.serie}</span>
                                    </TableCell>
                                    <TableCell className="font-black text-blue-800">{m.horas_uso_total}h</TableCell>
                                    <TableCell className="text-slate-500 font-bold uppercase text-[10px]">{m.intervalo_manutencao_horas}h</TableCell>
                                    <TableCell>{getStatusBadge(m.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600">
                                                <Pencil size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                                                onClick={() => {
                                                    setItemToDelete(m.id);
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
            </div>

            {/* Modals */}
            <Dialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                title="Novo Ativo (Máquina)"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome da Máquina</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                                placeholder="Ex: Ensacadeira 01"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Modelo</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                                placeholder="Ex: Modelo-X"
                                value={formData.modelo}
                                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Número de Série</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold font-mono"
                                placeholder="Ex: SN12345"
                                value={formData.serie}
                                onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Intervalo de Preventiva (h)</label>
                            <input
                                type="number"
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                                value={formData.intervalo_manutencao_horas}
                                onChange={(e) => setFormData({ ...formData, intervalo_manutencao_horas: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Horas Atuais</label>
                            <input
                                type="number"
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold"
                                value={formData.horas_uso_total}
                                onChange={(e) => setFormData({ ...formData, horas_uso_total: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} className="bg-blue-800 text-white">Salvar Ativo</Button>
                    </div>
                </div>
            </Dialog>

            <AlertDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Remover Ativo"
                description="Tem certeza que deseja excluir esta máquina? O histórico de OS também poderá ser afetado."
                confirmText="Excluir"
            />
        </div>
    );
};

export default Maquinas;
