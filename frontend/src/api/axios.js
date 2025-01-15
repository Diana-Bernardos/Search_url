// src/api/axios.js
import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 30000
});

// Interceptor para añadir el token
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores
instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si el error es 403 (Forbidden) y no hemos intentado renovar el token
        if (error.response?.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Intentar renovar el token
                const response = await instance.post('/auth/refresh');
                const { token } = response.data;

                // Guardar nuevo token
                localStorage.setItem('token', token);

                // Actualizar el token en la petición original y reintentarla
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return instance(originalRequest);
            } catch (refreshError) {
                // Si no se puede renovar el token, limpiar la sesión
                localStorage.removeItem('token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default instance;