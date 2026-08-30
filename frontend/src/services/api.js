import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

export const generateTemplate = (prompt) => api.post('/generate-template', { prompt });
export const estimateCost = (templateYaml) => api.post('/estimate-cost', { template_yaml: templateYaml });
export const securityCheck = (templateYaml) => api.post('/security-check', { template_yaml: templateYaml });
export const generateDiagram = (templateYaml) => api.post('/generate-diagram', { template_yaml: templateYaml });
export const getHistory = () => api.get('/history');
export const downloadPackage = (id) => api.get(`/download/${id}`, { responseType: 'blob' });

export default api;
