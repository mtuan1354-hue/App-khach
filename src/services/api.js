import { API_CONFIG } from '../config/constants';

async function requestWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (err) {
    return { ok: false, offline: true, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

export const NinjaApi = {
  async createOrder(orderPayload) {
    return requestWithTimeout(`${API_CONFIG.baseUrl}/api/orders`, {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    });
  },

  async fetchCustomerOrders(phone) {
    return requestWithTimeout(
      `${API_CONFIG.baseUrl}/api/orders?phone=${encodeURIComponent(phone)}`,
      { method: 'GET' }
    );
  },

  async cancelOrder(orderId) {
    return requestWithTimeout(`${API_CONFIG.baseUrl}/api/orders/${orderId}/cancel`, {
      method: 'POST',
    });
  },

  async requestWithdraw(withdrawPayload) {
    return requestWithTimeout(`${API_CONFIG.baseUrl}/api/wallet/withdraw`, {
      method: 'POST',
      body: JSON.stringify(withdrawPayload),
    });
  },
};
