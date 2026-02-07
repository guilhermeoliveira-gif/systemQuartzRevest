import React, { useEffect } from 'react';
import AuthForm from '../../components/auth/AuthForm';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    if (loading) {
        return <div className="text-center p-4">Carregando...</div>;
    }

    return (
        <div>
            <AuthForm />
        </div>
    );
};

export default Login;
