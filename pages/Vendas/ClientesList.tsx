import React, { useEffect, useState } from 'react';
import { Plus, Search, User, Phone, Mail, MapPin, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { vendasService } from '../../services/vendasService';
import { VendaCliente } from '../../types_vendas';
import { useToast } from '../../contexts/ToastContext';

const ClientesList: React.FC = () => {
    const [clientes, setClientes] = useState<VendaCliente[]>([]);
    const [busca, setBusca] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const { showToast } = useToast();

    const [newCliente, setNewCliente] = useState<Partial<VendaCliente>>({
        nome: '',
        cnpj_cpf: '',
        contato: '',
        endereco: '',
        email: '',
        telefone: ''
    });

    useEffect(() => {
        loadClientes();
    }, []);

    const loadClientes = async () => {
        try {
            const data = await vendasService.getClientes();
            setClientes(data);
        } catch (error) {
            console.error(error);
            showToast('Erro ao carregar clientes', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCliente.nome) return;

        try {
            await vendasService.criarCliente(newCliente as any);
            showToast('Cliente cadastrado com sucesso!', { type: 'success' });
            setShowModal(false);
            setNewCliente({ nome: '', cnpj_cpf: '', contato: '', endereco: '', email: '', telefone: '' });
            loadClientes();
        } catch (error) {
            console.error(error);
            showToast('Erro ao salvar cliente', { type: 'error' });
        }
    };

    const filteredClientes = clientes.filter(c =>
        c.nome.toLowerCase().includes(busca.toLowerCase()) ||
        c.cnpj_cpf?.includes(busca)
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                    <Link to="/vendas" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
                        <p className="text-slate-500">Gestão de carteira e contatos.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                    <Plus size={20} /> Novo Cliente
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nome ou CPF/CNPJ..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20 text-slate-400 animate-pulse">
                    Carregando clientes...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClientes.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300 italic">
                            Nenhum cliente encontrado.
                        </div>
                    ) : filteredClientes.map(cliente => (
                        <div key={cliente.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                    <User size={18} />
                                </button>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors uppercase truncate">{cliente.nome}</h3>
                            <p className="text-xs text-slate-400 font-mono mb-4">{cliente.cnpj_cpf || 'DOCUMENTO NÃO CADASTRADO'}</p>

                            <div className="space-y-3">
                                {cliente.contato && (
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400"><User size={14} /></div>
                                        <span>{cliente.contato}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400"><Phone size={14} /></div>
                                    <span>{cliente.telefone || 'Sem telefone'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400"><Mail size={14} /></div>
                                    <span className="truncate">{cliente.email || 'Sem e-mail'}</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm text-slate-600 pt-2 border-t border-slate-50">
                                    <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 mt-0.5"><MapPin size={14} /></div>
                                    <span className="text-xs italic leading-relaxed">{cliente.endereco || 'Endereço não informado'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Novo Cliente */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-4">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Plus className="text-blue-600" /> Novo Cliente
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome/Razão Social *</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newCliente.nome}
                                    onChange={e => setNewCliente({ ...newCliente, nome: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">CPF/CNPJ</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newCliente.cnpj_cpf}
                                        onChange={e => setNewCliente({ ...newCliente, cnpj_cpf: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Pessoa de Contato</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newCliente.contato}
                                        onChange={e => setNewCliente({ ...newCliente, contato: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newCliente.telefone}
                                        onChange={e => setNewCliente({ ...newCliente, telefone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newCliente.email}
                                        onChange={e => setNewCliente({ ...newCliente, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Endereço Completo</label>
                                <textarea
                                    rows={2}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newCliente.endereco}
                                    onChange={e => setNewCliente({ ...newCliente, endereco: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                                >
                                    Salvar Cliente
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientesList;
