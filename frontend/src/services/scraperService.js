// src/services/scraperService.js
import api from './api';

export const scrapeUrl = async (url) => {
    try {
        console.log('Analizando URL:', url);
        const response = await api.post('/scraper', { url });

        if (!response.data) {
            throw new Error('No se recibieron datos del servidor');
        }

        console.log('Respuesta del servidor:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error en scrapeUrl:', error);
        
        if (!error.response) {
            throw new Error('No se pudo conectar con el servidor. Por favor, verifica que el servidor esté corriendo.');
        } else if (error.response.status === 403) {
            throw new Error('No tienes permisos para realizar esta acción. Por favor, inicia sesión nuevamente.');
        } else if (error.response.status === 400) {
            throw new Error(error.response.data.error || 'La URL proporcionada no es válida');
        }

        throw new Error(error.response?.data?.error || 'Error al analizar la URL');
    }
};

export const getHistorialBusquedas = async () => {
    try {
        const response = await api.get('/scraper/history');
        return response.data;
    } catch (error) {
        console.error('Error al obtener historial:', error);
        throw error.response?.data?.error || 'Error al obtener el historial';
    }
};

export const eliminarPropiedad = async (propertyId) => {
    try {
        const response = await api.delete(`/scraper/property/${propertyId}`);
        return response.data;
    } catch (error) {
        console.error('Error al eliminar propiedad:', error);
        throw error.response?.data?.error || 'Error al eliminar la propiedad';
    }
};

export const guardarBusqueda = async (data) => {
    try {
        const response = await api.post('/scraper/save', data);
        return response.data;
    } catch (error) {
        console.error('Error al guardar búsqueda:', error);
        throw error.response?.data?.error || 'Error al guardar la búsqueda';
    }
};