// src/api/scraper.js
import axios from './axios';

export const scrapeUrl = async (url) => {
    try {
        console.log('Enviando URL para scraping:', url);
        const response = await axios.post('/scraper/scrape', { url });
        console.log('Respuesta del scraping:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error detallado:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw error;
    }
};

export const getHistory = async () => {
    try {
        const response = await axios.get('/scraper/history');
        return response.data;
    } catch (error) {
        console.error('Error en getHistory:', error);
        throw error;
    }
};

export const deleteProperty = async (propertyId) => {
    try {
        const response = await axios.delete(`/scraper/property/${propertyId}`);
        return response.data;
    } catch (error) {
        console.error('Error en deleteProperty:', error);
        throw error;
    }
};
