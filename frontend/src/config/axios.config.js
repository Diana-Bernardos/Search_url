// src/config/axios.config.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de peticiones
axiosInstance.interceptors.request.use(
  async config => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Agregar timestamp para evitar cache
    config.params = {
      ...config.params,
      _t: Date.now()
    };

    return config;
  },
  error => {
    console.error('Error en la petición:', error);
    return Promise.reject(error);
  }
);

// Interceptor de respuestas
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Si el error es 401 (Unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Si el error es 403 (Forbidden) y no hemos intentado renovar el token
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Intentar renovar el token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          const response = await axiosInstance.post('/auth/refresh', {
            refreshToken
          });

          const { token } = response.data;
          localStorage.setItem('token', token);

          // Actualizar el token en la petición original
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Reintentar la petición original
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error('Error al renovar el token:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Manejo de errores de red
    if (!error.response) {
      console.error('Error de red:', error.message);
      return Promise.reject(new Error('Error de conexión. Por favor, verifica tu conexión a internet.'));
    }

    // Manejo de timeout
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout de la petición:', error);
      return Promise.reject(new Error('La petición ha tardado demasiado. Por favor, inténtalo de nuevo.'));
    }

    // Log del error para debugging
    console.error('Error en la respuesta:', {
      status: error.response?.status,
      data: error.response?.data,
      url: originalRequest?.url,
      method: originalRequest?.method
    });

    // Devolver el error con un mensaje más amigable
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message || 
                        'Ha ocurrido un error inesperado';

    return Promise.reject(new Error(errorMessage));
  }
);

// Función para configurar el token después del login
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

export default axiosInstance;