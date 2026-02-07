import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, Briefcase, Building, LogOut, ChevronRight, Settings, Bell, Lock } from 'lucide-react';

const Perfil: React.FC = () => {
    const { profile, signOut } = useAuth();

    const handleLogout = async () => {
        if (confirm('Deseja realmente sair do sistema?')) {
            await signOut();
            window.location.reload();
        }
    };

    if (!profile) return null;

    const sections = [
        { icon: Settings, label: 'Configurações da Conta', color: 'text-blue-500' },
        { icon: Bell, label: 'Notificações', color: 'text-orange-500' },
        { icon: Lock, label: 'Alterar Senha', color: 'text-red-500' },
    ];

    return (
        <div className="max-w-md mx-auto space-y-6 pb-10">
            {/* Profile Header */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white mb-4 shadow-lg ring-4 ring-white">
                    <User size={48} strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">{profile.nome}</h2>
                <p className="text-slate-500 font-medium">{profile.cargo || 'Funcionário'} • {profile.setor || 'Geral'}</p>

                <div className="mt-6 flex gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100 uppercase tracking-wider">
                        Ativo
                    </span>
                    <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-xs font-bold border border-slate-100 uppercase tracking-wider">
                        {profile.id.substring(0, 8)}
                    </span>
                </div>
            </div>

            {/* Info Cards */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Informações Pessoais</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    <div className="p-4 flex items-center gap-3">
                        <Mail className="text-slate-400" size={20} />
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">E-mail Corporativo</p>
                            <p className="text-sm font-bold text-slate-700">{profile.email}</p>
                        </div>
                    </div>
                    <div className="p-4 flex items-center gap-3">
                        <Building className="text-slate-400" size={20} />
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Setor</p>
                            <p className="text-sm font-bold text-slate-700">{profile.setor || 'Não informado'}</p>
                        </div>
                    </div>
                    <div className="p-4 flex items-center gap-3">
                        <Briefcase className="text-slate-400" size={20} />
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Cargo</p>
                            <p className="text-sm font-bold text-slate-700">{profile.cargo || 'Não informado'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Sections */}
            <div className="space-y-2">
                {sections.map((section, idx) => (
                    <button
                        key={idx}
                        className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`${section.color} bg-white p-2 rounded-xl border border-slate-100`}>
                                <section.icon size={20} />
                            </div>
                            <span className="font-bold text-slate-700">{section.label}</span>
                        </div>
                        <ChevronRight className="text-slate-300" size={20} />
                    </button>
                ))}
            </div>

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="w-full bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex items-center justify-center gap-2 font-black uppercase tracking-widest hover:bg-red-100 transition-colors mt-4"
            >
                <LogOut size={20} />
                Sair do Sistema
            </button>

            <p className="text-center text-slate-400 text-[10px] font-medium pt-4 uppercase tracking-[0.2em]">
                Versão 2.4.0 • QuartzRevest 2026
            </p>
        </div>
    );
};

export default Perfil;
