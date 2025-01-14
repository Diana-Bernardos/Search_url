// src/config/axios.config.js
import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:3001/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para el token
instance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        console.log('Token para solicitud:', token);
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            console.log('Token añadido a la solicitud:', token); // Log para depuración
        } else {
            console.warn('No se encontró token de autenticación'); // Log de advertencia
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    },

// Interceptor para manejar errores
instance.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            // Error con respuesta del servidor
            if (error.response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
            return Promise.reject(error);
        } else if (error.request) {
            // Error de red
            return Promise.reject(new Error('Error de conexión con el servidor'));
        }
        return Promise.reject(error);
    }
),

// Interceptor para manejar errores globalmente
axios.interceptors.response.use(
    response => response,
    error => {
        console.error('Error de Axios:', error);
        
        if (error.response) {
            // El servidor respondió con un código de error
            console.error('Datos de error:', error.response.data);
            console.error('Código de estado:', error.response.status);
        } else if (error.request) {
            // La solicitud se hizo pero no se recibió respuesta
            console.error('Sin respuesta del servidor:', error.request);
        } else {
            // Algo sucedió al configurar la solicitud
            console.error('Error de configuración:', error.message);
        }
        
        return Promise.reject(error);
    }),
);


export default instance;