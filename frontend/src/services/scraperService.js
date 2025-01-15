import api from '../config/axios.config'; // Asegúrate de importar correctamente

export const preAnalyzeUrl = async (url) => {
    try {
        // Validación y formateo de URL
        if (!url || typeof url !== 'string') {
            throw new Error('URL inválida. Debe ser una cadena de texto.');
        }

        const formattedUrl = url.match(/^https?:\/\//) 
            ? url 
            : `https://${url.replace(/^\/+/, '')}`;

        const response = await api.post('/scraper/pre-analyze', { url: formattedUrl });

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

        const response = await api.post('/scraper/delete-property', { propertyId });

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

// En tu scraperService.js
export const scrapeUrl = async (url) => {
    try {
        // Validación y formateo de URL
        if (!url || typeof url !== 'string') {
            throw new Error('URL inválida. Debe ser una cadena de texto.');
        }

        const formattedUrl = url.match(/^https?:\/\//) 
            ? url 
            : `https://${url.replace(/^\/+/, '')}`;

        console.group('Scraping URL');
        console.log('URL formateada:', formattedUrl);
        
        const response = await api.post('/scraper', { url: formattedUrl }, {
            timeout: 300000 // 5 minutos
        });

        console.log('Respuesta completa:', response);
        console.groupEnd();

        // Verificaciones adicionales
        if (response && response.data && response.data.success) {
            return response.data;
        } else {
            throw new Error('Respuesta inesperada del servidor');
        }

    } catch (error) {
        console.error('Error en scrapeUrl:', {
            name: error.name,
            message: error.message,
            code: error.code,
            response: error.response
        });
        console.groupEnd();
        if (error.code === 'ECONNABORTED') {
            throw new Error('La operación de scraping ha excedido el tiempo límite. Por favor, inténtelo de nuevo más tarde.');
        }



        // Manejo específico de errores
        if (error.response) {
            throw new Error(
                error.response.data?.error || 
                `Error del servidor: ${error.response.status}`
            );
        }

        throw new Error(
            error.message || 
            'Error de conexión con el servidor'
        );
    }
};