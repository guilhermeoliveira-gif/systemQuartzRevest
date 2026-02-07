import React from 'react';
import { Outlet } from 'react-router-dom';
import { Cpu } from 'lucide-react';
import { APP_VERSION } from '../src/version';

const AuthLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Left Column: Brand / Image */}
            <div className="hidden md:flex flex-col justify-between w-1/2 lg:w-3/5 bg-slate-900 text-white p-12 relative overflow-hidden">
                {/* Background Pattern/Image Overlay */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/95 to-blue-900/40"></div>

                {/* Content */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-xl">
                        <Cpu size={32} className="text-white" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter uppercase">QuartzRevest</span>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h1 className="text-5xl font-bold mb-6 leading-tight">
                        Gestão Inteligente para a <span className="text-blue-500">Indústria 4.0</span>
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Controle total de estoque, produção e qualidade em um ecossistema integrado de alta performance.
                    </p>
                </div>

                <div className="relative z-10 flex items-center gap-4 text-sm text-slate-500 font-medium">
                    <span>&copy; {new Date().getFullYear()} QuartzRevest</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                    <span>v{APP_VERSION}</span>
                </div>
            </div>

            {/* Right Column: Auth Form */}
            <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md animate-in slide-in-from-right-8 duration-500">
                    <div className="md:hidden flex justify-center mb-8">
                        <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-600/20">
                            <Cpu size={32} className="text-white" />
                        </div>
                    </div>

                    <Outlet />

                    {/* Mobile Footer */}
                    <div className="md:hidden mt-12 text-center">
                        <p className="text-xs text-slate-400">
                            v{APP_VERSION} &bull; QuartzRevest System
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
