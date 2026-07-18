import { API_BASE_URL } from '../config';

function getErrorMessage(payload, fallbackMessage) {
  if (!payload) return fallbackMessage;

  if (typeof payload.detail === 'string') return payload.detail;
  if (typeof payload.message === 'string') return payload.message;

  if (Array.isArray(payload.detail)) {
    const first = payload.detail[0];
    if (typeof first === 'string') return first;
    if (first && typeof first.msg === 'string') return first.msg;
  }

  if (payload.detail && typeof payload.detail === 'object' && typeof payload.detail.msg === 'string') {
    return payload.detail.msg;
  }

  return fallbackMessage;
}

async function parseApiResponse(response, fallbackMessage) {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = getErrorMessage(payload, fallbackMessage);
    const error = new Error(message);
    error.response = {
      status: response.status,
      data: payload,
    };
    throw error;
  }

  return payload;
}

export async function loginUser(credentials) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    }),
  });

  return { data: await parseApiResponse(response, 'Login failed') };
}

export async function registerUser(credentials) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: credentials.email.trim().toLowerCase(),
      username: credentials.username.trim(),
      password: credentials.password,
      confirm_password: credentials.confirmPassword,
    }),
  });

  return { data: await parseApiResponse(response, 'Registration failed') };
}
