// src/controllers/scraperController.js
const pool = require('../config/database');
const axios = require('axios');
const cheerio = require('cheerio');

const scrapeUrl = async (req, res) => {
    let connection;
    try {
        const { url } = req.body;
        const userId = req.user.id;

        // Validar URL
        if (!url) {
            return res.status(400).json({ error: 'URL es requerida' });
        }

        try {
            new URL(url);
        } catch (err) {
            return res.status(400).json({ error: 'URL inválida' });
        }

        // Hacer el scraping
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ScraperBot/1.0;)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            },
            timeout: 15000,
            maxRedirects: 5
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

        // Guardar en base de datos
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.execute(
            'INSERT INTO urls_scrapeadas (user_id, url, titulo, descripcion) VALUES (?, ?, ?, ?)',
            [userId, url, properties.title, properties.metaDescription]
        );

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

        await connection.commit();
        
        // Enviar respuesta
        res.json({
            message: 'Scraping completado exitosamente',
            properties
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

const getScrapingHistory = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT us.*, GROUP_CONCAT(ps.nombre_propiedad) as propiedades 
             FROM urls_scrapeadas us 
             LEFT JOIN propiedades_scrapeadas ps ON us.id = ps.url_id 
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

const deleteProperty = async (req, res) => {
    let connection;
    try {
        const propertyId = req.params.propertyId;
        const userId = req.user.id;

        console.log('Intentando eliminar propiedad:', { propertyId, userId });

        connection = await pool.getConnection();

        // Primero verificamos que la propiedad existe y pertenece al usuario
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

        // Si existe, la eliminamos
        await connection.execute(
            `DELETE FROM propiedades_scrapeadas 
             WHERE nombre_propiedad = ? 
             AND url_id IN (SELECT id FROM urls_scrapeadas WHERE user_id = ?)`,
            [propertyId, userId]
        );

        console.log('Propiedad eliminada con éxito');

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
    scrapeUrl,
    getScrapingHistory,
    deleteProperty
};