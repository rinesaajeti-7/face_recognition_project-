import api from './api';

export const searchImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/search/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};