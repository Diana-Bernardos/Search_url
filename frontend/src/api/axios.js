// src/api/axios.js
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
      'Content-Type': 'application/json'
  }
})


// Añadir token a las peticiones
instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Logging
instance.interceptors.request.use(
  request => {
    console.log('Enviando petición:', request.url, request.data);
    return request;
  }
);

instance.interceptors.response.use(
  response => {
    console.log('Respuesta recibida:', response.data);
    return response;
  },
  error => {
    console.error('Error en petición:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default instance;