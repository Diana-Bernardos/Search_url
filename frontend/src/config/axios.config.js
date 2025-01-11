// src/config/axios.config.js
import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:3001/api',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para el token
instance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

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
);

export default instance;