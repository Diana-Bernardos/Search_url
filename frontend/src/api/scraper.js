// src/api/scraper.js 
import axios from './axios'; // Importa tu instancia configurada de axios (ver punto 2)

export const scrapeUrl = async (url) => {
    try {
        const response = await axios.post('/scraper', { url }); // /scraper
        return response.data;
      } catch (error) {
        console.error("Error en scrapeUrl:", error);
        throw error;
      }
    };


export const getHistory = async () => {
    try {
        const response = await axios.get('/scraper/history'); 
        return response.data;
    } catch (error) {
        console.error("Error en getHistory:", error);
        throw error;
    }
};

export const deleteProperty = async (propertyId) => {
    try {
        const response = await axios.delete(`/scraper/property/${propertyId}`);
        return response.data;
    } catch (error) {
        console.error("Error en deleteProperty:", error);
        throw error;
    }
};
