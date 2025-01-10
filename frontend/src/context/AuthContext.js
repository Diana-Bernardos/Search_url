// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Validar el token con el backend
                const response = await axios.get('/auth/validate');
                setUser(response.data.user);
            } catch (error) {
                console.error('Error validando token:', error);
                logout(); // Limpiar sesión si el token es inválido
            }
        }
        setLoading(false);
    };

    const login = async (credentials) => {
        try {
            const response = await axios.post('/auth/login', credentials);
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            setUser(user);
            
            // Configurar el token en axios
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            return user;
        } catch (error) {
            setError(error.response?.data?.error || 'Error al iniciar sesión');
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const register = async (userData) => {
        try {
            const response = await axios.post('/auth/register', userData);
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            setUser(user);
            
            // Configurar el token en axios
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            return user;
        } catch (error) {
            setError(error.response?.data?.error || 'Error al registrarse');
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                login,
                logout,
                register,
                checkAuth
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