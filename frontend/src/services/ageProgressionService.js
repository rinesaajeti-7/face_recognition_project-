// frontend/src/services/ageProgressionService.js
import api from './api';

export const predictAgeProgression = async (personId, targetAge) => {
  const token = localStorage.getItem('access_token');
  try {
    // Vetëm "/age-progression/predict" pa "/api" sepse baseURL e ka
    const response = await api.post('/age-progression/predict', 
      { person_id: personId, target_age: targetAge },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response;
  } catch (error) {
    console.error('Error in predictAgeProgression:', error);
    throw error;
  }
};