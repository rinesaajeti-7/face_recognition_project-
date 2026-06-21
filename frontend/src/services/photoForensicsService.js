import api from './api';

export const analyzePhoto = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  console.log('📡 Sending request to /photo-forensics/analyze');
  console.log('📁 File:', file.name, file.size, file.type);
  
  const response = await api.post('/photo-forensics/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  // Kthe vetëm të dhënat (response.data) – jo të gjithë objektin e axios
  return response.data;
};

export const compareFaces = async (file1, file2) => {
  const formData = new FormData();
  formData.append('file1', file1);
  formData.append('file2', file2);
  
  const response = await api.post('/photo-forensics/compare-faces', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return response.data;
};