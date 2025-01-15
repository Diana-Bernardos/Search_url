import axios from '../config/axios.config';

export const authService = {
  login: async (credentials) => {
    try {
      console.log('Intentando login con:', { 
        email: credentials.email 
      });

      const response = await axios.post('/auth/login', credentials);
      
      console.log('Respuesta de login:', {
        token: response.data.token ? '***OCULTO***' : 'No hay token',
        user: response.data.user
      });

      // Guardar token
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('Token guardado en localStorage');
      } else {
        console.warn('No se recibió token en la respuesta');
        throw new Error('No se recibió token de autenticación');
      }

      return response.data;
    } catch (error) {
      console.error('Error de login:', {
        name: error.name,
        message: error.message,
        response: error.response
      });

      // Manejo específico de errores
      if (error.response) {
        // El servidor respondió con un código de error
        throw new Error(
          error.response.data?.error || 
          `Error del servidor: ${error.response.status}`
        );
      }

      // Error de red u otros errores
      throw new Error(
        error.message || 
        'Error de conexión. Intente nuevamente.'
      );
    }
  },

  validateToken: async () => {
    try {
      const response = await axios.get('/auth/validate-token');
      return response.data;
    } catch (error) {
      console.error('Error al validar token:', error);
      
      // Eliminar token inválido
      localStorage.removeItem('token');
      
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
  }
};
