// src/scripts/seedDatabase.js
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { mockData, testUsers } = require('../mock/testData');

async function seedDatabase() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    console.log('Iniciando inserción de datos de prueba...');

    // Insertar usuarios
    for (const user of testUsers) {
      console.log(`Insertando usuario: ${user.username}`);
      
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const [userResult] = await connection.execute(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [user.username, user.email, hashedPassword]
      );

      const userId = userResult.insertId;
      
      // Insertar datos de scraping
      for (const mockUrl of mockData.urls) {
        const [urlResult] = await connection.execute(
          'INSERT INTO urls_scrapeadas (user_id, url, titulo, descripcion) VALUES (?, ?, ?, ?)',
          [userId, mockUrl.url, mockUrl.title, mockUrl.description]
        );

        const urlId = urlResult.insertId;

        // Insertar propiedades de manera recursiva
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

        await saveProperties(mockUrl.properties);

        // Registrar en historial
        await connection.execute(
          'INSERT INTO historial_busquedas (user_id, url) VALUES (?, ?)',
          [userId, mockUrl.url]
        );
      }
    }

    await connection.commit();
    console.log('Datos de prueba insertados correctamente');

  } catch (error) {
    await connection.rollback();
    console.error('Error al insertar datos de prueba:', error);
    throw error;
  } finally {
    connection.release();
    process.exit();
  }
}

// Ejecutar el script
seedDatabase()
  .then(() => console.log('Script completado exitosamente'))
  .catch(error => {
    console.error('Error en el script:', error);
    process.exit(1);
  });