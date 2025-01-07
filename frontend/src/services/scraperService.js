
// src/services/scraperService.js
import axios from '../api/axios';

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