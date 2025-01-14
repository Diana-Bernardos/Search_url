// src/controllers/scraperController.js
const pool = require('../config/database');
const axios = require('axios');
const cheerio = require('cheerio');

const preAnalyzeUrl = async (req, res) => {
    try {
        let { url } = req.body;

        // Validación y formateo de URL
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ 
                success: false, 
                error: 'URL es requerida y debe ser una cadena de texto válida' 
            });
        }

        // Asegurar que la URL tenga un protocolo
        url = url.match(/^https?:\/\//) 
            ? url 
            : `https://${url.replace(/^\/+/, '')}`;

        try {
            // Intentar crear un objeto URL para validar
            const parsedUrl = new URL(url);
            
            // Validaciones adicionales
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Solo se permiten URLs http o https' 
                });
            }
        } catch (err) {
            return res.status(400).json({ 
                success: false, 
                error: 'URL inválida. Formato incorrecto.' 
            });
        }

        // Realizar el pre-análisis
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'Accept-Language': 'es-ES,es;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Cache-Control': 'max-age=0',
                'Referer': 'https://www.google.com/'
            },
            timeout: 10000,
            maxRedirects: 5
        });

        const $ = cheerio.load(response.data);

        const preAnalysis = {
            title: $('title').text().trim() || 'Sin título',
            description: $('meta[name="description"]').attr('content') || 'Sin descripción',
            basicInfo: {
                headings: $('h1, h2, h3').length,
                links: $('a').length,
                images: $('img').length
            }
        };

        res.json({
            success: true,
            data: preAnalysis
        });

    } catch (error) {
        console.error('Error en pre-análisis:', error);
        
        // Manejo detallado de errores
        if (error.response) {
            console.log('Detalles de la respuesta:', {
                status: error.response.status,
                headers: error.response.headers,
                data: error.response.data
            });
        }

        // Códigos de estado específicos
        if (error.response && error.response.status === 403) {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado. El sitio web puede estar bloqueando el scraping.'
            });
        }

        if (error.code === 'ECONNABORTED') {
            return res.status(408).json({
                success: false,
                error: 'Tiempo de conexión agotado al intentar acceder a la URL'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error en el pre-análisis',
            details: error.message
        });
    }
};
// Scraping principal (manteniendo tu lógica actual)
const scrapeUrl = async (req, res) => {
    let connection;
    try {
        const { url } = req.body;
        
        // Log detallado de la solicitud
        console.log('Solicitud de scraping recibida:', {
            url,
            user: req.user // Mostrar información del usuario
        });

        if (!url) {
            return res.status(400).json({ 
                error: 'URL es requerida' 
            });
        }

        // Realizar scraping
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'Accept-Language': 'es-ES,es;q=0.9'
            },
            timeout: 15000,
            maxRedirects: 5
        });

        // Procesar respuesta
        const $ = cheerio.load(response.data);

        const properties = {
            title: $('title').text().trim() || 'Sin título',
            metaDescription: $('meta[name="description"]').attr('content') || 'Sin descripción',
            headings: {
                h1: $('h1').length,
                h2: $('h2').length,
                h3: $('h3').length
            },
            links: $('a').length,
            images: $('img').length,
            paragraphs: $('p').length,
            metadata: {
                keywords: $('meta[name="keywords"]').attr('content') || '',
                author: $('meta[name="author"]').attr('content') || '',
                robots: $('meta[name="robots"]').attr('content') || ''
            },
            socialMeta: {
                ogTitle: $('meta[property="og:title"]').attr('content') || '',
                ogDescription: $('meta[property="og:description"]').attr('content') || '',
                ogImage: $('meta[property="og:image"]').attr('content') || ''
            }
        };

        // Respuesta exitosa
        res.json({
            success: true,
            data: {
                properties: properties,
                url: url
            }
        });

        // Análisis con IA de Ollama
        try {
            const aiResponse = await axios.post('http://localhost:11434/api/generate', {
                model: 'llama3.2:3b-instruct-q8_0',
                prompt: `Analiza esta propiedad inmobiliaria:
                Título: ${properties.title}
                Descripción: ${properties.metaDescription}
            
                Información clave:
                - Precio: ${properties.price || 'No especificado'}
                - Ubicación: ${properties.location || 'No especificada'}
                - Habitaciones: ${properties.rooms || 'No especificado'}
            
                Proporciona un análisis detallado y recomendaciones:
                1. Evalúa si esta propiedad es una buena inversión
                2. Compara con el mercado inmobiliario actual
                3. Recomienda aspectos positivos y mejoras potenciales
                4. Sugerencias para el comprador o inversor
                5. Potencial de revalorización
            
                Formato de respuesta:
                - Resumen general
                - Puntos fuertes
                - Puntos a mejorar
                - Recomendación final`,
                stream: false
            });

            console.log('Respuesta completa de IA:', aiResponse.data);
    console.log('Texto de la respuesta de IA:', aiResponse.data.response);


            properties.aiAnalysis = aiResponse.data.response;
        } catch (aiError) {
            console.error('Error en análisis IA:', aiError);
            properties.aiAnalysis = 'No se pudo realizar el análisis con IA';
        }
        

        // Guardar en base de datos
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.execute(
            'INSERT INTO urls_scrapeadas (user_id, url, titulo, descripcion) VALUES (?, ?, ?, ?)',
            [userId, url, properties.title, properties.metaDescription]
        );

        // Guardar propiedades (manteniendo tu lógica actual)
        for (const [key, value] of Object.entries(properties)) {
            if (typeof value === 'object') {
                for (const [subKey, subValue] of Object.entries(value)) {
                    await connection.execute(
                        'INSERT INTO propiedades_scrapeadas (url_id, nombre_propiedad, valor_propiedad) VALUES (?, ?, ?)',
                        [result.insertId, `${key}_${subKey}`, String(subValue)]
                    );
                }
            } else {
                await connection.execute(
                    'INSERT INTO propiedades_scrapeadas (url_id, nombre_propiedad, valor_propiedad) VALUES (?, ?, ?)',
                    [result.insertId, key, String(value)]
                );
            }
        }

        // Guardar análisis de IA
        if (properties.aiAnalysis) {
            await connection.execute(
                'INSERT INTO recomendaciones_ia (url_id, recomendacion) VALUES (?, ?)',
                [result.insertId, properties.aiAnalysis]
            );
        }

        await connection.commit();
        
        res.json({
            message: 'Scraping completado exitosamente',
            data: {
                properties: properties,
                aiRecommendation: properties.aiAnalysis
            }
        });


    } catch (error) {
        console.error('Error en scrapeUrl:', error);
        
        if (connection) {
            await connection.rollback();
        }

        if (error.code === 'ECONNREFUSED') {
            return res.status(400).json({ error: 'No se pudo conectar con la URL proporcionada' });
        }

        if (error.response?.status) {
            return res.status(error.response.status).json({
                error: `Error al acceder a la URL: ${error.message}`
            });
        }

        res.status(500).json({
            error: 'Error al procesar la URL',
            details: error.message
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Historial (usando POST en lugar de GET)
const getScrapingHistory = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT us.*, 
                    GROUP_CONCAT(ps.nombre_propiedad) as propiedades,
                    ri.recomendacion as ai_recomendacion
             FROM urls_scrapeadas us 
             LEFT JOIN propiedades_scrapeadas ps ON us.id = ps.url_id 
             LEFT JOIN recomendaciones_ia ri ON us.id = ri.url_id
             WHERE us.user_id = ? 
             GROUP BY us.id 
             ORDER BY us.fecha_creacion DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ error: 'Error al obtener el historial' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Eliminar propiedad (usando POST en lugar de DELETE)
const deleteProperty = async (req, res) => {
    let connection;
    try {
        const { propertyId } = req.body;  // Cambio de req.params a req.body
        const userId = req.user.id;

        connection = await pool.getConnection();

        const [property] = await connection.execute(
            `SELECT ps.* 
             FROM propiedades_scrapeadas ps
             JOIN urls_scrapeadas us ON ps.url_id = us.id
             WHERE ps.nombre_propiedad = ? 
             AND us.user_id = ?`,
            [propertyId, userId]
        );

        if (!property || property.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Propiedad no encontrada'
            });
        }

        await connection.execute(
            `DELETE FROM propiedades_scrapeadas 
             WHERE nombre_propiedad = ? 
             AND url_id IN (SELECT id FROM urls_scrapeadas WHERE user_id = ?)`,
            [propertyId, userId]
        );

        res.json({
            success: true,
            message: 'Propiedad eliminada correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar propiedad:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar la propiedad'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = {
    preAnalyzeUrl,
    scrapeUrl,
    getScrapingHistory,
    deleteProperty
};