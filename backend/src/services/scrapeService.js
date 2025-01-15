import api from '../config/axios.config'; // Ajusta la ruta de importación

export const AnalyzeUrl = async (url) => {
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

export const deleteProperty = async (propertyId) => {
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

export const scrapeUrl = async (url) => {
    try {
        // Validación y formateo de URL
        if (!url || typeof url !== 'string') {
            throw new Error('URL inválida. Debe ser una cadena de texto.');
        }

        const formattedUrl = url.match(/^https?:\/\//) 
            ? url 
            : `https://${url.replace(/^\/+/, '')}`;

        // Configuración de axios más detallada
        const response = await api.post('/scraper', { 
            url: formattedUrl 
        }, {
            // Aumentar el tiempo de espera
            timeout: 30000,
            // Manejar específicamente diferentes tipos de errores
            validateStatus: function (status) {
                return status >= 200 && status < 500; // Rechazar solo errores de servidor
            }
        });

        // Manejo de diferentes escenarios de respuesta
        if (!response) {
            throw new Error('No se recibió respuesta del servidor');
        }

        if (response.status !== 200) {
            console.error('Respuesta del servidor:', response);
            throw new Error(`Error del servidor: ${response.status} - ${response.statusText}`);
        }

        if (!response.data) {
            throw new Error('No se recibieron datos del scraping');
        }

        return response;

    } catch (error) {
        console.error('Error completo en scrapeUrl:', error);

        // Manejo detallado de diferentes tipos de errores
        if (error.code === 'ECONNABORTED') {
            throw new Error('Tiempo de espera agotado. El servidor no responde.');
        }

        if (error.response) {
            // El servidor respondió con un código de error
            console.error('Detalles del error del servidor:', error.response.data);
            throw new Error(`Error del servidor: ${error.response.status} - ${error.response.statusText}`);
        }

        if (error.request) {
            // La solicitud se hizo pero no se recibió respuesta
            console.error('Sin respuesta del servidor:', error.request);
            throw new Error('No se pudo conectar con el servidor. Compruebe la conexión.');
        }

        // Error de configuración u otro tipo de error
        throw new Error(error.message || 'Error de conexión con el servidor');
    }
};

export const getHistorialBusquedas = async () => {
    try {
        const response = await api.get('/scraper/history');
        return response.data;
    } catch (error) {
        console.error('Error al obtener historial:', error);
        throw new Error('Error al obtener el historial de búsquedas');
    }
};

export const eliminarPropiedad = async (propertyId) => {
    try {
        const response = await api.delete(`/scraper/property/${propertyId}`);
        return response.data;
    } catch (error) {
        console.error('Error al eliminar propiedad:', error);
        throw new Error('Error al eliminar la propiedad');
    }
};