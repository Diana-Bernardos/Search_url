const puppeteer = require('puppeteer');
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

const scrapeUrl = async (req, res) => {
    console.time('scraping');
    console.log('Iniciando scraping para:', req.body.url);

    let browser;
    let connection;
    try {
        // Verificar y obtener userId de manera segura
        const userId = req.user?.id;

        // Destructuración segura con valor por defecto
        const { url } = req.body || {};

        console.group('Scraping Detallado');
        console.log('Inicio de scraping');
        console.log('URL recibida:', url);
        console.log('ID de usuario:', userId);

        // Validaciones iniciales más robustas
        if (!userId) {
            console.warn('Usuario no autenticado');
            return res.status(401).json({ 
                success: false,
                error: 'Usuario no autenticado' 
            });
        }

        if (!url) {
            return res.status(400).json({ 
                success: false,
                error: 'URL es requerida' 
            });
        }

        // Validación adicional de URL
        try {
            new URL(url);
        } catch (err) {
            return res.status(400).json({ 
                success: false,
                error: 'URL inválida' 
            });
        }

        // Configuración de navegador más robusta
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage'
            ]
        });

        const page = await browser.newPage();

        // Configuraciones para evitar bloqueos
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Navegar a la página con mayor tolerancia
        try {
            await page.goto(url, { 
                waitUntil: 'networkidle2', 
                timeout: 60000 
            });
        } catch (navigationError) {
            console.error('Error de navegación:', navigationError);
            await browser.close();
            return res.status(500).json({
                success: false,
                error: 'No se pudo cargar la página',
                details: navigationError.message
            });
        }

        // Extraer metadatos
        const pageMetadata = await page.evaluate(() => {
            return {
                title: document.title,
                description: document.querySelector('meta[name="description"]')?.content || '',
                headings: {
                    h1: document.querySelectorAll('h1').length,
                    h2: document.querySelectorAll('h2').length,
                    h3: document.querySelectorAll('h3').length
                },
                links: document.querySelectorAll('a').length,
                images: document.querySelectorAll('img').length,
                socialMeta: {
                    ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
                    ogDescription: document.querySelector('meta[property="og:description"]')?.content || '',
                    ogImage: document.querySelector('meta[property="og:image"]')?.content || ''
                }
            };
        });

        // Cerrar navegador
        await browser.close();

        // Análisis con IA (opcional)
        let aiAnalysis = 'No se pudo realizar el análisis con IA';
        try {
            const aiResponse = await axios.post('http://localhost:11434/api/generate', {
                model: 'llama3.2:3b-instruct-q8_0',
                prompt: `Analiza esta página web:
                Título: ${pageMetadata.title}
                Descripción: ${pageMetadata.description}
                Elementos: ${JSON.stringify(pageMetadata.headings)}
                
                Proporciona un análisis conciso sobre:
                1. Calidad del SEO
                2. Estructura de la página
                3. Recomendaciones de mejora`,
                stream: false
            });

            aiAnalysis = aiResponse.data.response || aiAnalysis;
        } catch (aiError) {
            console.error('Error en análisis IA:', aiError);
        }

        // Conexión a base de datos
        connection = await pool.getConnection();
        
        // Iniciar transacción
        await connection.beginTransaction();

        // Insertar URL scrapeada
        const [urlResult] = await connection.execute(
            'INSERT INTO urls_scrapeadas (user_id, url, titulo, descripcion) VALUES (?, ?, ?, ?)',
            [userId, url, pageMetadata.title, pageMetadata.description]
        );

        const urlId = urlResult.insertId;

        // Insertar propiedades
        for (const [key, value] of Object.entries(pageMetadata)) {
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

        // Insertar análisis de IA
        if (aiAnalysis && aiAnalysis !== 'No se pudo realizar el análisis con IA') {
            await connection.execute(
                'INSERT INTO recomendaciones_ia (url_id, recomendacion) VALUES (?, ?)',
                [urlId, aiAnalysis]
            );
        }

        // Commit de la transacción
        await connection.commit();

        console.log('Scraping completado exitosamente');
        console.groupEnd();

        res.json({
            success: true,
            data: {
                properties: pageMetadata,
                aiRecommendation: aiAnalysis
            }
        });

    } catch (error) {
        console.error('Error detallado en scraping:', {
            mensaje: error.message,
            código: error.code,
            pila: error.stack
        });
        console.groupEnd();

        // Rollback en caso de error
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Error en rollback:', rollbackError);
            }
        }

        // Cerrar navegador si está abierto
        if (browser) {
            try {
                await browser.close();
            } catch (browserCloseError) {
                console.error('Error cerrando navegador:', browserCloseError);
            }
        }

        // Enviar respuesta de error
        res.status(500).json({
            success: false,
            error: 'Error al procesar la URL',
            details: error.message
        });
    } finally {
        // Liberar conexión de base de datos
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

const deleteProperty = async (req, res) => {
    let connection;
    try {
        const { propertyId } = req.body;
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