import axios from '../config/axios.config'; // Asegúrate de importar correctamente

export const preAnalyzeUrl = async (url) => {
    try {
        // Validación y formateo de URL
        if (!url || typeof url !== 'string') {
            throw new Error('URL inválida. Debe ser una cadena de texto.');
        }

        const formattedUrl = url.match(/^https?:\/\//) 
            ? url 
            : `https://${url.replace(/^\/+/, '')}`;

        const response = await axios.post('/scraper/pre-analyze', { url: formattedUrl });

        if (!response.data) {
            throw new Error('No se recibieron datos del pre-análisis');
        }

        return response.data;
    } catch (error) {
        console.error('Error en pre-análisis:', error);
        
        if (error.response) {
            console.error('Detalles del error del servidor:', error.response.data);
        }

        throw new Error(
            error.response?.data?.error || 
            error.message || 
            'Error en el pre-análisis'
        );
    }
};

export const removeProperty = async (propertyId) => {
    try {
        if (!propertyId) {
            throw new Error('ID de propiedad no válido');
        }

        const response = await axios.post('/scraper/delete-property', { propertyId });

        if (!response.data.success) {
            throw new Error(response.data.error || 'Error al eliminar la propiedad');
        }

        return response.data;
    } catch (error) {
        console.error('Error al eliminar propiedad:', error);
        
        if (error.response?.status === 404) {
            throw new Error('Propiedad no encontrada');
        }
        
        throw new Error('Error al eliminar la propiedad');
    }
};

export const scrapeUrl = async (url) => {
    try {
        // Validación y formateo de URL
        if (!url || typeof url !== 'string') {
            throw new Error('URL inválida. Debe ser una cadena de texto.');
        }

        const formattedUrl = url.match(/^https?:\/\//) 
            ? url 
            : `https://${url.replace(/^\/+/, '')}`;

        const response = await axios.post('/scraper', { 
            url: formattedUrl 
        });

        // Manejo de diferentes escenarios de respuesta
        if (!response) {
            throw new Error('No se recibió respuesta del servidor');
        }

        if (!response.data) {
            throw new Error('No se recibieron datos del scraping');
        }

        return response;

    } catch (error) {
        console.error('Error completo en scrapeUrl:', error);

        // Manejo detallado de diferentes tipos de errores
        if (error.response) {
            console.error('Detalles del error del servidor:', error.response.data);
            throw new Error(`Error del servidor: ${error.response.status} - ${error.response.statusText}`);
        }

        if (error.request) {
            console.error('Sin respuesta del servidor:', error.request);
            throw new Error('No se pudo conectar con el servidor. Compruebe la conexión.');
        }

        // Error de configuración u otro tipo de error
        throw new Error(error.message || 'Error de conexión con el servidor');
    }
};