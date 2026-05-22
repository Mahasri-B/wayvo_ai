import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BACKEND_URL
  ? `${process.env.REACT_APP_BACKEND_URL}/api/v1`
  : 'https://wayvo-ai.onrender.com/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
});

export const searchRoutes = async (payload) => {
  const { data } = await api.post('/routes/search', payload);
  return data;
};

export const getRouteGeometry = async (from, to) => {
  const { data } = await api.get('/routes/geometry', { params: { from_loc: from, to_loc: to } });
  return data;
};

export const searchLocation = async (q) => {
  const { data } = await api.get('/routes/locations/search', { params: { q } });
  return data;
};

export const sendChatMessage = async (message, context = null, history = []) => {
  const { data } = await api.post('/chat/', { message, context, history });
  return data;
};

export const getAlerts = async (district = null) => {
  const params = district ? { district } : {};
  const { data } = await api.get('/alerts/', { params });
  return data;
};

export const getDistrictWeather = async (district) => {
  const { data } = await api.get(`/alerts/weather/${district}`);
  return data;
};

export const getStats = async () => {
  const { data } = await api.get('/admin/stats');
  return data;
};

export const getHillStations = async () => {
  const { data } = await api.get('/admin/hill-stations');
  return data;
};

export default api;
