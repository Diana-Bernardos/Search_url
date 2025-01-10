// src/config/axios.config.js
import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:3001/api',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor de peticiones
instance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('Enviando petición a:', config.url, config.method.toUpperCase());
        return config;
    },
    error => {
        console.error('Error en la petición:', error);
        return Promise.reject(error);
    }
);

// Interceptor de respuestas
instance.interceptors.response.use(
    response => {
        console.log('Respuesta recibida de:', response.config.url);
        return response;
    },
    error => {
        if (error.response) {
            // El servidor respondió con un código de error
            if (error.response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
            console.error('Error del servidor:', error.response.data);
        } else if (error.request) {
            // La petición se realizó pero no se recibió respuesta
            console.error('No se recibió respuesta del servidor');
        } else {
            // Error en la configuración de la petición
            console.error('Error de configuración:', error.message);
        }
        return Promise.reject(error);
    }
);

export default instance;