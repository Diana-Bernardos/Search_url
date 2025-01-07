// src/services/databaseService.js
const pool = require('../config/database');

class DatabaseService {
    async saveScrapingResult(userId, scrapingData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Guardar URL principal
            const [urlResult] = await connection.execute(
                'INSERT INTO urls_scrapeadas (user_id, url, titulo, descripcion) VALUES (?, ?, ?, ?)',
                [userId, scrapingData.url, scrapingData.metadata.title, scrapingData.metadata.description]
            );

            const urlId = urlResult.insertId;

            // Guardar propiedades
            const properties = this.flattenProperties(scrapingData);
            for (const [key, value] of Object.entries(properties)) {
                await connection.execute(
                    'INSERT INTO propiedades_scrapeadas (url_id, nombre_propiedad, valor_propiedad) VALUES (?, ?, ?)',
                    [urlId, key, value.toString()]
                );
            }

            await connection.commit();
            return urlId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    flattenProperties(obj, prefix = '') {
        let flattened = {};
        
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const nested = this.flattenProperties(value, `${prefix}${key}_`);
                flattened = { ...flattened, ...nested };
            } else {
                flattened[`${prefix}${key}`] = Array.isArray(value) ? JSON.stringify(value) : value;
            }
        }
        
        return flattened;
    }
}

module.exports = {
    ScraperService: new ScraperService(),
    DatabaseService: new DatabaseService()
};