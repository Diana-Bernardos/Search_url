 
// src/services/scraperService.js
import axios from '../api/axios';
import axiosInstance from '../config/axios.config';
import api from '../config/axios.config';

export const scrapeUrl = async (url) => {
    try {
      const response = await axiosInstance.post('/scraper', { url });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

export const scraperService = {
  analyzeUrl: async (url) => {
    const response = await axios.post('/scraper/scrape', { url });
    return response.data;
  },

  getHistory: async () => {
    const response = await axios.get('/scraper/history');
    return response.data;
  },

  deleteProperty: async (propertyId) => {
    const response = await axios.delete(`/scraper/property/${propertyId}`);
    return response.data;
  }
};



export const analyzeUrl = async (url) => {
    try {
        console.log('🔍 Iniciando análisis de URL:', url);
        
        const response = await api.post('/scraper', { url });
        
        if (!response.data) {
            throw new Error('No se recibieron datos del servidor');
        }

        console.log('✅ Scraping completado exitosamente:', {
            title: response.data.properties.title,
            description: response.data.properties.metaDescription,
            numProperties: Object.keys(response.data.properties).length
        });

        return {
            ...response.data,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ Error en analyzeUrl:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: url
        });
        
        if (!error.response) {
            throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
        } else if (error.response.status === 403) {
            throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        } else if (error.response.status === 400) {
            throw new Error(error.response.data.error || 'URL inválida');
        } else if (error.response.status === 429) {
            throw new Error('Demasiadas peticiones. Por favor, espera un momento.');
        }

        throw new Error(error.response?.data?.error || 'Error al analizar la URL');
    }
};

export const formatScrapingResult = (data) => {
    if (!data?.properties) return null;

    return {
        title: data.properties.title || 'Sin título',
        description: data.properties.metaDescription || 'Sin descripción',
        stats: {
            images: data.properties.images || 0,
            links: data.properties.links || 0,
            headings: Object.values(data.properties.headings || {}).reduce((a, b) => a + b, 0)
        },
        metadata: {
            ...data.properties.metadata,
            ...data.properties.socialMeta
        }
    };
};