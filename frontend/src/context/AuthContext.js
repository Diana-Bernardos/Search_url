import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/axios.config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => { // AuthProvider component
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await api.get('/auth/validate-token');
                setUser(response.data.user);
            } catch (error) {
                console.error('Error validando token:', error);
                localStorage.removeItem('token');
                setUser(null);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const register = async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            setUser(user);
        } catch (error) {
            console.error('Error en el registro:', error);
            setError(error.response?.data?.error || error.message || 'Error al registrar usuario');
            throw error;
        }
    };

    const login = async (credentials) => { // Moved INSIDE AuthProvider
        try {
            const response = await api.post('/auth/login', credentials);
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            setUser(user);
        } catch (error) {
            console.error('Error de login:', error);
            throw error;
        }
    };

    const logout = () => { // Moved INSIDE AuthProvider
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                login,
                logout,
                checkAuth,
                register
            }}
        >
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};