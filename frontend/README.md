# Web Scraper

![Web Scraper Logo](../frontend/src/assets/images/logo.jpg);

## 📌 Descripción
Web Scraper es una aplicación web que permite a los usuarios analizar y extraer información de cualquier sitio web. La aplicación proporciona una interfaz intuitiva para visualizar, filtrar y gestionar los datos extraídos.

## 🚀 Características Principales
- Análisis de URLs en tiempo real
- Extracción de metadatos, títulos, enlaces e imágenes
- Tabla interactiva con capacidades de filtrado
- Sistema de autenticación de usuarios
- Almacenamiento de histórico de búsquedas
- Interfaz responsiva y amigable

## 🛠️ Tecnologías Utilizadas
### Frontend
- React
- Context API para gestión de estado
- Axios para peticiones HTTP
- Lucide React para iconos
- CSS modular

### Backend
- Node.js
- Express
- MySQL
- Cheerio para web scraping
- JWT para autenticación
- Bcrypt para encriptación

## 📋 Requisitos Previos
- Node.js (v14 o superior)
- MySQL (v8 o superior)
- npm o yarn

## 🔧 Instalación

### Backend
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/web-scraper.git

# Navegar al directorio del backend
cd web-scraper/backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Crear base de datos
mysql -u root -p < database/schema.sql

# Iniciar servidor
npm run dev
```

### Frontend
```bash
# Navegar al directorio del frontend
cd ../frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar aplicación
npm start
```

## 💾 Estructura de la Base de Datos

### Tabla `users`
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla `urls_scrapeadas`
```sql
CREATE TABLE urls_scrapeadas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    url VARCHAR(2048) NOT NULL,
    titulo VARCHAR(255),
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Tabla `propiedades_scrapeadas`
```sql
CREATE TABLE propiedades_scrapeadas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    url_id INT NOT NULL,
    nombre_propiedad VARCHAR(255) NOT NULL,
    valor_propiedad TEXT,
    FOREIGN KEY (url_id) REFERENCES urls_scrapeadas(id) ON DELETE CASCADE
);
```

## 📁 Estructura del Proyecto

### Frontend
```
frontend/
├── src/
│   ├── assets/
│   │   └── images/
│   ├── components/
│   │   ├── common/
│   │   └── scraper/
│   ├── context/
│   ├── pages/
│   ├── services/
│   └── styles/
```

### Backend
```
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── utils/
```

## 🔄 Flujo de Datos
1. Usuario ingresa URL en el frontend
2. Frontend valida formato y envía petición al backend
3. Backend realiza scraping usando Cheerio
4. Se extraen y procesan los datos
5. Se almacenan en la base de datos
6. Se devuelven al frontend
7. Se muestran en la tabla interactiva

## 🔐 Seguridad
- Autenticación mediante JWT
- Contraseñas hasheadas con bcrypt
- Validación de datos en frontend y backend
- Protección contra SQL injection
- Manejo seguro de sesiones

## 📱 Responsive Design
- Diseño adaptable a diferentes dispositivos
- Breakpoints para móvil, tablet y desktop
- Optimización de imágenes y recursos
- Interfaz fluida y accesible

## 🛟 Manejo de Errores
- Validación de URLs
- Mensajes de error amigables
- Retroalimentación visual de acciones
- Registro de errores en servidor

## 🔍 Funcionalidades de la Tabla
- Filtrado de resultados
- Ordenamiento por columnas
- Eliminación de propiedades
- Paginación de resultados

## 👥 Contribución
1. Fork el proyecto
2. Crea tu rama de características (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia
Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## ✉️ Contacto
Diana - 

