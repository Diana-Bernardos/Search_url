// src/services/scraperService.js
import api from './api';

export const scrapeUrl = async (url) => {
    try {
        console.log('Analizando URL:', url);
        
        // Validar URL antes de enviar
        try {
            new URL(url);
        } catch (err) {
            throw new Error('URL inválida. Debe comenzar con http:// o https://');
        }

        const response = await api.post('/scraper', { url });

        if (!response.data) {
            throw new Error('No se recibieron datos del servidor');
        }

        console.log('Respuesta del servidor:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error en scrapeUrl:', error);
        
        if (!error.response) {
            throw new Error('Error de conexión con el servidor');
        }

        if (error.response.status === 400) {
            throw new Error(error.response.data.error || 'URL inválida');
        }

        if (error.response.status === 500) {
            throw new Error('Error al procesar la URL. Por favor, intenta con otra URL.');
        }

        throw error;
    }
};

export const getHistorialBusquedas = async () => {
    try {
        const response = await api.get('/scraper/history');
        return response.data;
    } catch (error) {
        console.error('Error al obtener historial:', error);
        throw new Error('Error al obtener el historial de búsquedas');
    }
};

export const eliminarPropiedad = async (propertyId) => {
    try {
        const response = await api.delete(`/scraper/property/${propertyId}`);
        return response.data;
    } catch (error) {
        console.error('Error al eliminar propiedad:', error);
        throw new Error('Error al eliminar la propiedad');
    }
};