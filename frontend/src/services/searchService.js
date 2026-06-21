import api from './api';

export const searchImage = async (file) => {
  try {
    // Validimi i file-it
    if (!file) {
      throw new Error('Nuk është zgjedhur asnjë foto');
    }
    
    // Validimi i tipit të file-it
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Formati i fotos nuk është i lejuar. Përdorni JPEG, PNG, WEBP ose GIF');
    }
    
    // Validimi i madhësisë (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('Fotoja është shumë e madhe. Madhësia maksimale është 10MB');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    // Para api.post, shto:
    console.log('📡 Dërgohet kërkesa në URL:', api.defaults.baseURL + '/image');


    const response = await api.post('/image', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 min për face recognition
    });
    
    return response;
  } catch (error) {
    console.error('Error in searchImage:', error);
    
    // Trajtimi i gabimeve specifike
    if (error.code === 'ECONNABORTED') {
      const timeoutError = new Error('Kërkesa zgjati shumë. Provoni përsëri.');
      timeoutError.cause = error;
      throw timeoutError;
    }
    
    if (error.response) {
      // Gabim nga server-i
      switch (error.response.status) {
        case 400: {
          const badRequestError = new Error('Kërkesë e pavlefshme. Kontrolloni foton.');
          badRequestError.cause = error;
          throw badRequestError;
        }
        case 413: {
          const tooLargeError = new Error('Fotoja është shumë e madhe.');
          tooLargeError.cause = error;
          throw tooLargeError;
        }
        case 500: {
          const serverError = new Error('Gabim në server. Provoni përsëri më vonë.');
          serverError.cause = error;
          throw serverError;
        }
        default: {
          const defaultError = new Error(error.response.data?.message || 'Ndodhi një gabim gjatë kërkimit');
          defaultError.cause = error;
          throw defaultError;
        }
      }
    } else if (error.request) {
      // Nuk ka përgjigje nga server-i
      const connectionError = new Error('Nuk mund të lidhej me server-in. Kontrolloni lidhjen.');
      connectionError.cause = error;
      throw connectionError;
    } else {
      // Gabim tjetër - ruaj error-in origjinal si cause
      const originalError = new Error(error.message || 'Ndodhi një gabim i papritur');
      originalError.cause = error;
      throw originalError;
    }
  }
};

// Funksion shtesë për të kontrolluar statusin e server-it
export const checkServerHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Server health check failed:', error);
    return null;
  }
};

// Funksion për të marrë statistikat e kërkimeve
export const getSearchStats = async () => {
  try {
    const response = await api.get('/search/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching search stats:', error);
    return null;
  }
};
