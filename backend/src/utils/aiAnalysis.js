// src/utils/aiAnalysis.js
const axios = require('axios');

const analyzeWithAI = async (prompt) => {
    try {
        // Configuración para Ollama
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3.2:3b-instruct-q8_0',
            prompt: prompt,
            stream: false
        });

        return response.data.response;
    } catch (error) {
        console.error('Error en análisis IA:', error);
        return 'No se pudo realizar el análisis con IA';
    }
};

module.exports = {
    analyzeWithAI
};