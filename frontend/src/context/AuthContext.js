import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/axios.config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const checkAuth = async () => {
        console.group('Verificación de Autenticación');
        const token = localStorage.getItem('token');
        console.log('Token encontrado:', !!token);

        if (token) {
            try {
                console.log('Intentando validar token');
                const response = await api.get('/auth/validate-token');
                
                console.log('Respuesta de validación:', {
                    user: response.data.user ? 
                        { 
                            id: response.data.user.id, 
                            username: response.data.user.username 
                        } : 
                        'Sin datos de usuario'
                });

                setUser(response.data.user);
            } catch (error) {
                console.error('Error validando token:', {
                    message: error.message,
                    response: error.response?.data
                });
                localStorage.removeItem('token');
                setUser(null);
            } finally {
                console.groupEnd();
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const register = async (userData) => {
        console.group('Registro de Usuario');
        try {
            console.log('Datos de registro:', {
                username: userData.username,
                email: userData.email
            });

            const response = await api.post('/auth/register', userData);
            const { token, user } = response.data;

            console.log('Registro exitoso:', {
                user: { 
                    id: user.id, 
                    username: user.username 
                }
            });

            localStorage.setItem('token', token);
            setUser(user);
            console.groupEnd();
        } catch (error) {
            console.error('Error en el registro:', {
                message: error.message,
                response: error.response?.data
            });
            
            const errorMessage = error.response?.data?.error || 
                                 error.message || 
                                 'Error al registrar usuario';
            
            setError(errorMessage);
            console.groupEnd();
            throw error;
        }
    };

    const login = async (credentials) => {
        console.group('Login de Usuario');
        try {
            console.log('Intentando login:', {
                email: credentials.email
            });

            const response = await api.post('/auth/login', credentials);
            const { token, user } = response.data;

            console.log('Login exitoso:', {
                user: { 
                    id: user.id, 
                    username: user.username 
                }
            });

            localStorage.setItem('token', token);
            setUser(user);
            console.groupEnd();
            return user;
        } catch (error) {
            console.error('Error de login:', {
                message: error.message,
                response: error.response?.data
            });
            
            const errorMessage = error.response?.data?.error || 
                                 error.message || 
                                 'Error de inicio de sesión';
            
            setError(errorMessage);
            console.groupEnd();
            throw error;
        }
    };

    const logout = () => {
        console.group('Cierre de Sesión');
        console.log('Usuario desconectado');
        localStorage.removeItem('token');
        setUser(null);
        console.groupEnd();
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
                register,
                setError // Añadido para poder limpiar errores manualmente
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