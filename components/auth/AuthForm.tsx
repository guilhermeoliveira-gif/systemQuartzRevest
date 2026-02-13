import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

const AuthForm: React.FC = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '' // Only for signup
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                });
                if (error) throw error;
                // Navigation is handled by the parent component (Login.tsx) observing the auth state
                // navigate('/');
            } else {
                const { error, data } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            nome: formData.name
                        }
                    }
                });
                if (error) throw error;

                if (data.session) {
                    navigate('/');
                } else {
                    setMessage('Verifique seu email para confirmar o cadastro!');
                    setIsLogin(true);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto p-0 md:max-w-md">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6 font-primary">
                {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
            </h2>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {message && (
                <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-700 rounded-lg text-sm text-center">
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Nome Completo"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required={!isLogin}
                        />
                    </div>
                )}

                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                </div>

                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="password"
                        placeholder="Senha"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Processando...
                            </>
                        ) : (
                            isLogin ? 'Entrar' : 'Cadastrar'
                        )}
                    </button>
                </div>
            </form>


            <div className="mt-6 text-center text-sm text-gray-500">
                <p>Caso não tenha acesso, contate o administrador.</p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <button
                    type="button"
                    onClick={() => {
                        // Mock login for demo purposes if Supabase fails or for quick access
                        localStorage.setItem('antigravity_auth', 'true');
                        window.location.href = '/';
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                    Acesso Rápido (Demo Mode)
                </button>
            </div>
        </div>
    );
};

export default AuthForm;
