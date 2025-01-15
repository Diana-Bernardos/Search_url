import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api', 
    timeout: 30000, // Reducir tiempo de espera
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true // Añadir credenciales
});

// Interceptor de solicitudes
api.interceptors.request.use(
    config => {
        console.group('Solicitud Axios');
        console.log('URL base:', config.baseURL);
        console.log('URL completa:', config.url);
        console.log('Método:', config.method);

        const token = localStorage.getItem('token');
        
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            console.log('Token añadido');
        } else {
            console.warn('No se encontró token de autenticación');
        }

        console.groupEnd();
        
        return config;
    },
    error => {
        console.error('Error en interceptor de solicitud:', error);
        return Promise.reject(error);
    }
);

// Interceptor de respuestas
api.interceptors.response.use(
    response => response,
    error => {
        console.error('Error en interceptor de respuesta:', {
            url: error.config?.url,
            method: error.config?.method,
            name: error.name,
            message: error.message,
            code: error.code
        });

        // Manejo específico de errores de red
        if (error.code === 'ERR_NETWORK') {
            console.error('Error de red: No se puede conectar con el servidor');
            throw new Error('No se puede conectar con el servidor. Verifique su conexión de red.');
        }

        return Promise.reject(error);
    }
);

export default api;