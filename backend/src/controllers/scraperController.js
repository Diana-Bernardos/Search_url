const pool = require('../config/database'); // Ensure you have this import
const axios = require('axios');
const cheerio = require('cheerio');

const scrapeUrl = async (req, res) => {
    try {
        const { url } = req.body;
        const userId = req.user.id;

        console.log('Iniciando scraping para:', { url, userId });

        if (!url) {
            console.log('URL no proporcionada');
            return res.status(400).json({
                error: 'URL es requerida'
            });
        }

        // Validar formato de URL
        try {
            new URL(url);
        } catch (err) {
            console.log('URL inválida:', url);
            return res.status(400).json({
                error: 'URL inválida'
            });
        }

        // Registrar la búsqueda
        try {
            await pool.execute(
                'INSERT INTO historial_busquedas (user_id, url) VALUES (?, ?)',
                [userId, url]
            );
            console.log('Búsqueda registrada en historial');
        } catch (dbError) {
            console.error('Error al registrar búsqueda:', dbError);
            // Continuar a pesar del error en el registro
        }

        // Realizar el scraping con más opciones
        console.log('Iniciando petición HTTP a:', url);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 15000,
            maxRedirects: 5,
            validateStatus: function (status) {
                return status >= 200 && status < 300;
            }
        });

        console.log('Respuesta recibida, iniciando parsing');
        const $ = cheerio.load(response.data);

        // Extraer información con manejo de errores
        let properties = {};
        try {
            properties = {
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
            console.log('Propiedades extraídas:', properties);
        } catch (parseError) {
            console.error('Error al extraer propiedades:', parseError);
            properties = {
                title: 'Error al extraer propiedades',
                error: parseError.message
            };
        }

        // Guardar en la base de datos con manejo de transacción
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.execute(
                'INSERT INTO urls_scrapeadas (user_id, url, titulo, descripcion) VALUES (?, ?, ?, ?)',
                [userId, url, properties.title, properties.metaDescription]
            );

            const urlId = result.insertId;
            console.log('URL guardada con ID:', urlId);

            // Guardar propiedades
            for (const [key, value] of Object.entries(properties)) {
                if (typeof value === 'object') {
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

            await connection.commit();
            console.log('Transacción completada exitosamente');

            res.json({
                message: 'Scraping completado exitosamente',
                data: {
                    id: urlId,
                    url,
                    properties
                }
            });

        } catch (dbError) {
            await connection.rollback();
            console.error('Error en la base de datos:', dbError);
            res.status(500).json({ error: 'Error al guardar en la base de datos', details: dbError.message }); // Enviar error al cliente
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error general en scraping:', error);
        console.error('Stack trace:', error.stack);

        // Manejar diferentes tipos de errores y enviarlos al cliente
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: 'No se pudo conectar con el sitio web',
                details: error.message
            });
        }

        if (error.code === 'ETIMEDOUT') {
            return res.status(504).json({
                error: 'La conexión ha excedido el tiempo de espera',
                details: error.message
            });
        }

        if (error.response) {
            return res.status(error.response.status).json({
                error: `Error HTTP: ${error.response.status}`,
                details: error.response.statusText
            });
        }

        res.status(500).json({
            error: 'Error al realizar el scraping',
            details: error.message // Incluir detalles del error
        });
    }
};

const getScrapingHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const [history] = await pool.execute('SELECT * FROM historial_busquedas WHERE user_id = ?', [userId]);
        res.json(history);
    } catch (error) {
        console.error("Error al obtener el historial de scraping:", error);
        res.status(500).json({ error: 'Error al obtener el historial', details: error.message }); // Incluir detalles del error
    }
};

const deleteProperty = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { propertyId } = req.params;
        const userId = req.user.id;

        console.log('Intentando eliminar propiedad:', propertyId);

        // Verificar que la propiedad pertenece al usuario
        const [property] = await connection.execute(`
            SELECT ps.id 
            FROM propiedades_scrapeadas ps
            JOIN urls_scrapeadas us ON ps.url_id = us.id
            WHERE ps.id = ? AND us.user_id = ?
        `, [propertyId, userId]);

        if (property.length === 0) {
            return res.status(404).json({
                error: 'Propiedad no encontrada o no autorizada'
            });
        }
          // Eliminar propiedad
          await connection.execute(
            'DELETE FROM propiedades_scrapeadas WHERE id = ?',
            [propertyId]
        );

        res.json({
            success: true,
            message: 'Propiedad eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar propiedad:', error);
        res.status(500).json({
            error: 'Error al eliminar la propiedad',
            details: error.message
        });
    } finally {
        connection.release();
    }
};

module.exports = { scrapeUrl, getScrapingHistory, deleteProperty };