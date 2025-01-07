

const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { mockData, testUsers } = require('../mock/testData');

async function seedDatabase() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    console.log('Iniciando inserción de datos de prueba...');

    // Insertar usuarios de prueba
    for (const user of testUsers) {
      console.log(`Insertando usuario: ${user.username}`);
      
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const [userResult] = await connection.execute(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [user.username, user.email, hashedPassword]
      );

      const userId = userResult.insertId;
      console.log(`Usuario creado con ID: ${userId}`);

      // Insertar datos de scraping para cada usuario
      for (const mockUrl of mockData.urls) {
        console.log(`Procesando URL: ${mockUrl.url}`);
        
        const [urlResult] = await connection.execute(
          'INSERT INTO urls_scrapeadas (user_id, url, titulo, descripcion) VALUES (?, ?, ?, ?)',
          [userId, mockUrl.url, mockUrl.properties.title, mockUrl.properties.metaDescription]
        );

        const urlId = urlResult.insertId;

        // Insertar propiedades
        for (const [key, value] of Object.entries(mockUrl.properties)) {
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

        // Insertar en historial
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
  }
}

// Ejecutar el script
seedDatabase()
  .then(() => {
    console.log('Script completado exitosamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error en el script:', error);
    process.exit(1);
  });