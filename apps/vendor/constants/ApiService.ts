import { API_URL } from './Api';
import * as SecureStore from 'expo-secure-store';

// Authenticated fetch wrapper with automatic 401 token refresh
const authFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const token = await SecureStore.getItemAsync('access_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 - token expired, attempt refresh
  if (response.status === 401) {
    console.warn('[VendorAPI] 401 received - attempting token refresh');
    const refreshToken = await SecureStore.getItemAsync('refresh_token');

    if (!refreshToken) {
      throw new Error('Session expired. Please login again.');
    }

    try {
      const refreshResponse = await fetch(`${API_URL}/users/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Session expired. Please login again.');
      }

      const { access } = await refreshResponse.json();
      await SecureStore.setItemAsync('access_token', access);

      // Retry original request with new token
      return fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access}`,
          ...(options.headers as Record<string, string> || {}),
        },
      });
    } catch (err) {
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
};

// Multipart auth fetch (for file uploads - no Content-Type header)
const authFetchMultipart = async (endpoint: string, body: FormData): Promise<Response> => {
  const token = await SecureStore.getItemAsync('access_token');

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body,
  });

  if (response.status === 401) {
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    if (!refreshToken) throw new Error('Session expired. Please login again.');

    const refreshResponse = await fetch(`${API_URL}/users/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!refreshResponse.ok) throw new Error('Session expired. Please login again.');

    const { access } = await refreshResponse.json();
    await SecureStore.setItemAsync('access_token', access);

    return fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${access}` },
      body,
    });
  }

  return response;
};
export const VendorApiService = {
  getVendorBookings: async (status?: string) => {
    const params = status ? `?status=${status}` : '';
    const res = await authFetch(`/bookings/${params}`);
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return res.json();
  },

  acceptBooking: async (bookingId: string) => {
    const res = await authFetch(`/bookings/${bookingId}/accept/`, {
      method: 'POST',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to accept booking');
    }
    return res.json();
  },

  rejectBooking: async (bookingId: string, reason: string) => {
    const res = await authFetch(`/bookings/${bookingId}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to reject booking');
    }
    return res.json();
  },

  completeBooking: async (bookingId: string) => {
    const res = await authFetch(`/bookings/${bookingId}/complete/`, {
      method: 'POST',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to complete booking');
    }
    return res.json();
  },

  scanQR: async (qrCode: string) => {
    const res = await authFetch(`/bookings/scan-qr/`, {
      method: 'POST',
      body: JSON.stringify({ qr_code: qrCode }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to start ride');
    }
    return res.json();
  },

  getFleet: async () => {
    const res = await authFetch(`/inventory/bikes/`);
    if (!res.ok) throw new Error('Failed to fetch fleet');
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  },

  addVehicle: async (formData: FormData) => {
    const res = await authFetchMultipart(`/inventory/bikes/`, formData);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to add vehicle');
    }
    return res.json();
  },

  toggleBikeAvailability: async (bikeId: string) => {
    const res = await authFetch(`/inventory/bikes/${bikeId}/toggle-availability/`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to toggle availability');
    return res.json();
  },

  getEarningsSummary: async () => {
    const res = await authFetch(`/vendors/earnings/summary/`);
    if (!res.ok) throw new Error('Failed to fetch earnings summary');
    return res.json();
  },

  getEarnings: async () => {
    const res = await authFetch(`/vendors/earnings/`);
    if (!res.ok) throw new Error('Failed to fetch earnings');
    return res.json();
  },

  getPayouts: async () => {
    const res = await authFetch(`/vendors/payouts/`);
    if (!res.ok) throw new Error('Failed to fetch payouts');
    return res.json();
  },

  requestPayout: async (amount: number) => {
    const res = await authFetch(`/vendors/payouts/request/`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error('Failed to request payout');
    return res.json();
  },

  getBankDetails: async () => {
    const res = await authFetch(`/vendors/bank-details/`);
    if (!res.ok) throw new Error('Failed to fetch bank details');
    return res.json();
  },

  saveBankDetails: async (data: object) => {
    const res = await authFetch(`/vendors/bank-details/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save bank details');
    return res.json();
  },

  getProfile: async () => {
    const res = await authFetch(`/vendors/profile/`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  saveProfile: async (data: object) => {
    const res = await authFetch(`/vendors/profile/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save profile');
    return res.json();
  },

  getDashboardStats: async () => {
    const res = await authFetch(`/vendors/dashboard/stats/`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },
};
