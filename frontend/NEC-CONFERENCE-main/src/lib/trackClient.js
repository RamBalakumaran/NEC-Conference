// Lightweight client for posting tracking actions to the backend
// Use Vite env variables (import.meta.env) in the browser
// Fallback to localhost backend when env not provided
const API_BASE = import.meta.env.VITE_CONFERENCE_API || import.meta.env.VITE_API_BASE || 'http://localhost:5200';

async function postAction(payload, token) {
  const res = await fetch(`${API_BASE}/conference/track/action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });
  try { return await res.json(); } catch (e) { return { ok: res.ok }; }
}

export async function trackSignup({ name, email }, token) {
  return postAction({ action: 'signup', email, details: { name } }, token);
}

export async function trackLogin({ name, email }, token) {
  return postAction({ action: 'login', email, details: { name } }, token);
}

export async function trackCartAdd({ email, item, name }, token) {
  return postAction({ action: 'cart_add', email, details: { item, name } }, token);
}

export async function trackCartRemove({ email, item, name }, token) {
  return postAction({ action: 'cart_remove', email, details: { item, name } }, token);
}

export async function trackRegisteredPending({ userId, email, registrationId, amount, name }, token) {
  return postAction({ action: 'registered_pending', userId, email, details: { registrationId, name }, amount }, token);
}

export async function trackRegisteredPaid({ userId, email, transactionId, amount, role, name }, token) {
  return postAction({ action: 'registered_paid', userId, email, details: { transactionId, role, name }, amount }, token);
}

export async function trackLeftWithoutPayment({ userId, email, registrationId, name }, token) {
  return postAction({ action: 'left_without_payment', userId, email, details: { registrationId, name } }, token);
}

export default { postAction };
