// src/controllers/preAnalysisController.js
const axios = require('axios');
const cheerio = require('cheerio');

const preAnalyzeUrl = async (req, res) => {
    try {
        const { url } = req.body;

        // Ejemplo con una web inmobiliaria
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // Extraer datos básicos
        const preAnalysis = {
            title: $('title').text().trim() || 'Sin título',
            description: $('meta[name="description"]').attr('content') || 'Sin descripción',
            properties: {
                price: $('.property-price').text().trim(),
                location: $('.property-location').text().trim(),
                size: $('.property-size').text().trim(),
                rooms: $('.property-rooms').text().trim(),
                type: $('.property-type').text().trim()
            }
        };

        res.json({
            success: true,
            data: preAnalysis
        });

    } catch (error) {
        console.error('Error en pre-análisis:', error);
        res.status(500).json({
            success: false,
            error: 'Error al realizar el pre-análisis'
        });
    }
};