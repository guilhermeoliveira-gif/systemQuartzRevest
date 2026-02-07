
import React, { useState, useEffect } from 'react';
import {
    Search, Calendar, Filter, Download,
    ChevronLeft, ChevronRight, Hash, User
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { pcpService } from '../../services/pcpService';
import { useToast } from '../../contexts/ToastContext';

const PCPHistorico: React.FC = () => {
    const toast = useToast();
    const [historico, setHistorico] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await pcpService.getHistorico();
            setHistorico(data);
        } catch (error) {
            console.error(error);
            toast.error('Erro', 'Falha ao carregar histórico de produção.');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (iso: string) => {
        if (!iso) return '-';
        return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Histórico de Produção</h1>
                    <p className="text-slate-500 font-medium text-sm">Registros de contagens e tempos operacionais</p>
                </div>
                <Button variant="outline" className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">
                    <Download size={16} className="mr-2" /> Exportar CSV
                </Button>
            </header>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Filtrar por Produto..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-100 font-medium text-slate-700 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-100 font-medium text-slate-700 text-sm appearance-none">
                        <option>Todos os Operadores</option>
                        <option>Operador Padrão</option>
                    </select>
                </div>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="date"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-100 font-medium text-slate-700 text-sm"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
                <Table className="min-w-[1200px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>Operador</TableHead>
                            <TableHead>Início</TableHead>
                            <TableHead>Fim</TableHead>
                            <TableHead>Qtd. Realizada</TableHead>
                            <TableHead>Contador 1 (Iní/Fim)</TableHead>
                            <TableHead>Contador 2 (Iní/Fim)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={7} className="py-4"><div className="h-4 bg-slate-100 animate-pulse rounded w-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            historico.filter(h => h.item?.nome_produto_acabado.toLowerCase().includes(searchTerm.toLowerCase())).map((reg) => (
                                <TableRow key={reg.id}>
                                    <TableCell className="font-bold text-slate-700">{reg.item?.nome_produto_acabado}</TableCell>
                                    <TableCell className="text-slate-500">{reg.nome_operador}</TableCell>
                                    <TableCell className="text-slate-600 text-xs">{formatDateTime(reg.data_hora_inicio)}</TableCell>
                                    <TableCell className="text-slate-600 text-xs">{formatDateTime(reg.data_hora_fim)}</TableCell>
                                    <TableCell className="font-black text-blue-800">{reg.qtd_realizada || 0} un</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-[10px] font-bold">
                                            <span className="text-slate-400">INÍ: {reg.contador1_inicio}</span>
                                            <span className="text-slate-800">FIM: {reg.contador1_fim || '-'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-[10px] font-bold">
                                            <span className="text-slate-400">INÍ: {reg.contador2_inicio}</span>
                                            <span className="text-slate-800">FIM: {reg.contador2_fim || '-'}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {!loading && historico.length === 0 && (
                    <div className="p-20 text-center text-slate-400 font-medium italic">
                        Nada registrado neste período.
                    </div>
                )}
            </div>

            {/* Pagination Mock */}
            <div className="flex justify-between items-center py-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Exibindo {historico.length} logs</span>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-8 w-8 p-0" disabled><ChevronLeft size={16} /></Button>
                    <Button variant="outline" className="h-8 w-8 p-0" disabled><ChevronRight size={16} /></Button>
                </div>
            </div>
        </div>
    );
};

export default PCPHistorico;
