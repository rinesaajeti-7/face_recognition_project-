// frontend/src/services/ageToolService.js
import api from './api';

/**
 * Analizon moshën dhe gjininë nga një foto (kërkon autentifikim)
 * @param {File} imageFile - Fotografia e ngarkuar
 * @returns {Promise<{data: {age: number, gender: string, probability: number, face_detected: boolean}}>}
 */
export const analyzeAgeForProgression = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);

  // ✅ Ndryshimi kryesor: hiq '/api' shtesë
  const response = await api.post('/analyze-face', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  // Formati që kthen backend (sipas shembullit me DeepFace):
  // { age: 25, gender: "Mashkull", raw_gender: "male", probability: 0.99 }
  const data = response.data;
  return {
    data: {
      age: data.age,
      gender: data.gender,           // tashmë "Mashkull" ose "Femër"
      probability: data.probability,
      face_detected: true
    }
  };
};

/**
 * Analizon moshën dhe gjininë pa autentifikim (për publikun)
 * @param {File} imageFile - Fotografia e ngarkuar
 * @returns {Promise<{age: number, gender: string, probability: number}>}
 */
export const publicAnalyzeAgeForProgression = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);

  const response = await fetch('http://localhost:8000/api/analyze-face', {
    method: 'POST',
    body: formData
  });
  const data = await response.json();
  return {
    age: data.age,
    gender: data.gender,
    probability: data.probability,
    face_detected: true
  };
};