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

export async function generateOutfits(userId, occasion, topK = 10) {
  const response = await fetch(`${API_BASE_URL}/outfits/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      occasion: occasion,
      top_k: topK,
    }),
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : null;
    throw new Error(getErrorMessage(payload, 'Failed to generate outfits'));
  }

  return await response.json();
}

export async function checkOutfitHealth() {
  const response = await fetch(`${API_BASE_URL}/outfits/health`);
  return await response.json();
}
