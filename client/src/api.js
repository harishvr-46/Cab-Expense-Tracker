const BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');

function buildHeaders(customHeaders = {}) {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };
}

async function request(path, opts = {}) {
  const res = await fetch(BASE + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

export const api = {
  get: (path) => request(path, { method: 'GET', headers: buildHeaders() }),
  post: (path, body) => request(path, { method: 'POST', headers: buildHeaders(), body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', headers: buildHeaders(), body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE', headers: buildHeaders() }),
};

export default api;
