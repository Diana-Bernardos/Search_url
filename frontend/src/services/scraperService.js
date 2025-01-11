// src/services/scraperService.js
import api from '../config/axios.config';

export const scrapeUrl = async (url) => {
    try {
        // Validar URL
        try {
            new URL(url);
        } catch {
            throw new Error('URL inválida. Debe comenzar con http:// o https://');
        }

        const response = await api.post('/scraper', { url });

        if (!response.data) {
            throw new Error('No se recibieron datos del servidor');
        }

        return response.data;
    } catch (error) {
        console.error('Error en scrapeUrl:', error);
        
        if (!error.response) {
            throw new Error('Error de conexión con el servidor');
        }

        const errorMessage = error.response?.data?.error || 'Error al analizar la URL';
        throw new Error(errorMessage);
    }
};

export const getScrapingHistory = async () => {
    try {
        const response = await api.get('/scraper/history');
        return response.data;
    } catch (error) {
        console.error('Error al obtener historial:', error);
        throw new Error('Error al obtener el historial de búsquedas');
    }
};

export const deleteProperty = async (propertyId) => {
    try {
        if (!propertyId) {
            throw new Error('ID de propiedad no válido');
        }

        console.log('Eliminando propiedad:', propertyId);
        const response = await api.delete(`/scraper/property/${propertyId}`);

        if (!response.data.success) {
            throw new Error(response.data.error || 'Error al eliminar la propiedad');
        }

        return response.data;
    } catch (error) {
        console.error('Error al eliminar propiedad:', error);
        if (error.response?.status === 404) {
            throw new Error('Propiedad no encontrada');
        }
        throw new Error('Error al eliminar la propiedad');
    }
};