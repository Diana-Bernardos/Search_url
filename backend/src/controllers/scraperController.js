// src/controllers/scraperController.js
const pool = require('../config/database');
const config = require('../config/config');
const axios = require('axios');
const cheerio = require('cheerio');

const scrapeUrl = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { url } = req.body;
        const userId = req.user.id;

        console.log('Iniciando scraping para:', { url, userId });

        // Validación de URL
        if (!url) {
            return res.status(400).json({
                error: 'URL es requerida'
            });
        }

        try {
            new URL(url);
        } catch (err) {
            return res.status(400).json({
                error: 'URL inválida'
            });
        }

        // Registrar búsqueda
        await connection.execute(
            'INSERT INTO historial_busquedas (user_id, url, fecha) VALUES (?, ?, NOW())',
            [userId, url]
        );

        // Realizar el scraping
        const response = await axios.get(url, {
            headers: {
                'User-Agent': config.scraper.userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            timeout: config.limits.scraperTimeout,
            maxRedirects: config.scraper.maxRedirects,
            maxContentLength: config.scraper.maxResponseSize,
            validateStatus: function (status) {
                return status >= 200 && status < 300;
            }
        });

        const $ = cheerio.load(response.data);

        // Extraer propiedades
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

        // Iniciar transacción
        await connection.beginTransaction();

        // Guardar URL principal
        const [result] = await connection.execute(
            'INSERT INTO urls_scrapeadas (user_id, url, titulo, descripcion, fecha_scrapeo) VALUES (?, ?, ?, ?, NOW())',
            [userId, url, properties.title, properties.metaDescription]
        );

        const urlId = result.insertId;

        // Guardar propiedades
        for (const [key, value] of Object.entries(properties)) {
            if (typeof value === 'object' && value !== null) {
                for (const [subKey, subValue] of Object.entries(value)) {
                    await connection.execute(
                        'INSERT INTO propiedades_scrapeadas (url_id, nombre_propiedad, valor_propiedad) VALUES (?, ?, ?)',
                        [urlId, `${key}_${subKey}`, String(subValue)]
                    );
                }
            } else {
                await connection.execute(
                    'INSERT INTO propiedades_scrapeadas (url_id, nombre_propiedad, valor_propiedad) VALUES (?, ?, ?)',
                    [urlId, key, String(value)]
                );
            }
        }

        // Confirmar transacción
        await connection.commit();

        // Enviar respuesta
        res.json({
            message: 'Scraping completado exitosamente',
            properties: properties
        });

    } catch (error) {
        // Rollback en caso de error
        if (connection) {
            await connection.rollback();
        }

        console.error('Error en scrapeUrl:', error);

        // Manejar diferentes tipos de errores
        if (error.code === 'ECONNABORTED') {
            return res.status(408).json({
                error: 'Tiempo de espera agotado al acceder a la URL'
            });
        }

        if (error.response) {
            return res.status(error.response.status || 500).json({
                error: `Error al acceder a la URL: ${error.message}`
            });
        }

        return res.status(500).json({
            error: 'Error al procesar la URL',
            details: error.message
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getScrapingHistory = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT urls_scrapeadas.*, 
             GROUP_CONCAT(CONCAT(propiedades_scrapeadas.nombre_propiedad, ':', propiedades_scrapeadas.valor_propiedad)) as propiedades
             FROM urls_scrapeadas 
             LEFT JOIN propiedades_scrapeadas ON urls_scrapeadas.id = propiedades_scrapeadas.url_id
             WHERE urls_scrapeadas.user_id = ?
             GROUP BY urls_scrapeadas.id
             ORDER BY urls_scrapeadas.fecha_scrapeo DESC`,
            [req.user.id]
        );

        res.json(rows);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({
            error: 'Error al obtener el historial'
        });
    }
};

const deleteProperty = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { propertyId } = req.params;
        const userId = req.user.id;

        await connection.beginTransaction();

        // Verificar que la propiedad pertenece al usuario
        const [property] = await connection.execute(
            `SELECT propiedades_scrapeadas.* 
             FROM propiedades_scrapeadas 
             INNER JOIN urls_scrapeadas ON urls_scrapeadas.id = propiedades_scrapeadas.url_id
             WHERE propiedades_scrapeadas.id = ? AND urls_scrapeadas.user_id = ?`,
            [propertyId, userId]
        );

        if (!property.length) {
            await connection.rollback();
            return res.status(404).json({
                error: 'Propiedad no encontrada'
            });
        }

        // Eliminar la propiedad
        await connection.execute(
            'DELETE FROM propiedades_scrapeadas WHERE id = ?',
            [propertyId]
        );

        await connection.commit();

        res.json({
            message: 'Propiedad eliminada correctamente'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al eliminar propiedad:', error);
        res.status(500).json({
            error: 'Error al eliminar la propiedad'
        });
    } finally {
        connection.release();
    }
};

module.exports = {
    scrapeUrl,
    getScrapingHistory,
    deleteProperty
};