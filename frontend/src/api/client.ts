import axios from 'axios';

// In production (Render), VITE_API_URL points to the backend service URL.
// In dev, falls back to relative /api (proxied by vite.config.ts).
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const client = axios.create({
  baseURL,
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json'
  }
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export default client;
