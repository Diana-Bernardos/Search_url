// src/controllers/scraperController.js
const pool = require('../config/database');
const axios = require('axios');
const cheerio = require('cheerio');

const scrapeUrl = async (req, res) => {
   console.log("Entrando en scrapeUrl");
   try {
       const { url } = req.body;
       const userId = req.user.id;

       console.log('Iniciando scraping para:', { url, userId });

       if (!url) {
           return res.status(400).json({
               success: false,
               error: 'URL es requerida'
           });
       }

       // Validar URL
       try {
           new URL(url);
       } catch (err) {
           return res.status(400).json({
               success: false,
               error: 'URL inválida'
           });
       }

       // Realizar scraping
       console.log('Iniciando petición HTTP a:', url);
       const response = await axios.get(url, {
           headers: {
               'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
               'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
               'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3'
           },
           timeout: 15000,
           maxRedirects: 5
       });

       const $ = cheerio.load(response.data);

       // Extraer información
       const scrapedData = {
           title: $('title').text().trim() || 'Sin título',
           description: $('meta[name="description"]').attr('content') || 'Sin descripción',
           properties: {
               metadata: {
                   title: $('title').text().trim() || 'Sin título',
                   description: $('meta[name="description"]').attr('content') || 'Sin descripción',
                   keywords: $('meta[name="keywords"]').attr('content') || 'Sin palabras clave',
                   author: $('meta[name="author"]').attr('content') || 'Autor no especificado',
                   language: $('html').attr('lang') || 'No especificado'
               },
               content: {
                   headings: {
                       h1: $('h1').length,
                       h2: $('h2').length,
                       h3: $('h3').length
                   },
                   links: $('a').length,
                   images: $('img').length,
                   paragraphs: $('p').length
               },
               social: {
                   ogTitle: $('meta[property="og:title"]').attr('content') || '',
                   ogDescription: $('meta[property="og:description"]').attr('content') || '',
                   ogImage: $('meta[property="og:image"]').attr('content') || '',
                   twitterCard: $('meta[name="twitter:card"]').attr('content') || '',
                   twitterTitle: $('meta[name="twitter:title"]').attr('content') || ''
               }
           }
       };

       // Guardar en base de datos
       const connection = await pool.getConnection();
       try {
           await connection.beginTransaction();

           // Guardar URL principal
           const [result] = await connection.execute(
               'INSERT INTO urls_scrapeadas (user_id, url, titulo, descripcion) VALUES (?, ?, ?, ?)',
               [userId, url, scrapedData.title, scrapedData.description]
           );

           const urlId = result.insertId;

           // Guardar propiedades de manera recursiva
           const saveProperties = async (properties, parentKey = '') => {
               for (const [key, value] of Object.entries(properties)) {
                   const propertyKey = parentKey ? `${parentKey}_${key}` : key;
                   
                   if (typeof value === 'object' && value !== null) {
                       await saveProperties(value, propertyKey);
                   } else {
                       await connection.execute(
                           'INSERT INTO propiedades_scrapeadas (url_id, nombre_propiedad, valor_propiedad) VALUES (?, ?, ?)',
                           [urlId, propertyKey, String(value)]
                       );
                   }
               }
           };

           await saveProperties(scrapedData.properties);
           await connection.commit();

           // Enviar respuesta
           res.json({
               success: true,
               data: {
                   id: urlId,
                   url,
                   title: scrapedData.title,
                   description: scrapedData.description,
                   properties: scrapedData.properties
               }
           });

       } catch (dbError) {
           await connection.rollback();
           console.error('Error en base de datos:', dbError);
           throw dbError;
       } finally {
           connection.release();
       }

   } catch (error) {
       console.error('Error en scraping:', error);
       
       if (error.code === 'ECONNREFUSED') {
           return res.status(503).json({
               success: false,
               error: 'No se pudo conectar con el sitio web',
               details: error.message
           });
       }

       if (error.code === 'ETIMEDOUT') {
           return res.status(504).json({
               success: false,
               error: 'Tiempo de espera excedido',
               details: error.message
           });
       }

       res.status(500).json({
           success: false,
           error: 'Error al realizar el scraping',
           details: error.message
       });
   }
};

const getScrapingHistory = async (req, res) => {
   try {
       const userId = req.user.id;
       const [results] = await pool.execute(`
           SELECT 
               us.id,
               us.url,
               us.titulo as title,
               us.descripcion as description,
               us.fecha_scraping,
               JSON_OBJECT(
                   'metadata', JSON_OBJECT(
                       'title', MAX(CASE WHEN ps.nombre_propiedad LIKE 'metadata_title%' THEN ps.valor_propiedad END),
                       'description', MAX(CASE WHEN ps.nombre_propiedad LIKE 'metadata_description%' THEN ps.valor_propiedad END)
                   ),
                   'content', JSON_OBJECT(
                       'links', MAX(CASE WHEN ps.nombre_propiedad = 'content_links' THEN ps.valor_propiedad END),
                       'images', MAX(CASE WHEN ps.nombre_propiedad = 'content_images' THEN ps.valor_propiedad END)
                   )
               ) as properties
           FROM urls_scrapeadas us
           LEFT JOIN propiedades_scrapeadas ps ON us.id = ps.url_id
           WHERE us.user_id = ?
           GROUP BY us.id
           ORDER BY us.fecha_scraping DESC
       `, [userId]);

       res.json({
           success: true,
           data: results
       });
   } catch (error) {
       console.error('Error al obtener historial:', error);
       res.status(500).json({
           success: false,
           error: 'Error al obtener historial',
           details: error.message
       });
   }
};

const deleteProperty = async (req, res) => {
   const connection = await pool.getConnection();
   
   try {
       const { propertyId } = req.params;
       const userId = req.user.id;

       const [property] = await connection.execute(`
           SELECT ps.id 
           FROM propiedades_scrapeadas ps
           JOIN urls_scrapeadas us ON ps.url_id = us.id
           WHERE ps.id = ? AND us.user_id = ?
       `, [propertyId, userId]);

       if (property.length === 0) {
           return res.status(404).json({
               success: false,
               error: 'Propiedad no encontrada o no autorizada'
           });
       }

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
           success: false,
           error: 'Error al eliminar propiedad',
           details: error.message
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