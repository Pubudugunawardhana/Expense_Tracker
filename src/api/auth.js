const BASE = '/api/auth';

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
};

export const apiLogin = (email, password) =>
  fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(handleResponse);

export const apiRegister = (name, email, password) =>
  fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  }).then(handleResponse);

export const apiForgotPassword = (email) =>
  fetch(`${BASE}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).then(handleResponse);

export const apiResetPassword = (token, password) =>
  fetch(`${BASE}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  }).then(handleResponse);

export const apiGetMe = (token) =>
  fetch(`${BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(handleResponse);
