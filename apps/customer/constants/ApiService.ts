import * as SecureStore from 'expo-secure-store';
import { API_URL } from './Api';

// Token storage keys matching AuthContext
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';

// Store tokens
export const storeTokens = async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
};

// Get access token
export const getAccessToken = async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
};

// Get refresh token
export const getRefreshToken = async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

// Store user data
export const storeUserData = async (userData: any) => {
    await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData));
};

// Get user data
export const getUserData = async (): Promise<any | null> => {
    const data = await SecureStore.getItemAsync(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
};

// Clear all auth data
export const clearAuthData = async () => {
    await Promise.all([
        SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_DATA_KEY),
    ]);
};

let onSessionExpired: (() => void) | null = null;

export const setSessionExpiredCallback = (callback: () => void) => {
    onSessionExpired = callback;
};

// Authenticated fetch wrapper with 401 token refresh
export const authFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    let token = await getAccessToken();
    const refreshToken = await getRefreshToken();

    if (!token && !refreshToken) {
        if (onSessionExpired) onSessionExpired();
        throw new Error('Session expired');
    }

    // If access token is missing but refresh token is present, try refreshing first
    if (!token && refreshToken) {
        console.warn('Access token missing but refresh token present - refreshing first');
        try {
            const refreshResponse = await fetch(`${API_URL}/users/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refreshToken }),
            });

            if (!refreshResponse.ok) {
                await clearAuthData();
                if (onSessionExpired) onSessionExpired();
                throw new Error('Session expired. Please login again.');
            }

            const { access } = await refreshResponse.json();
            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
            token = access;
        } catch (err) {
            await clearAuthData();
            if (onSessionExpired) onSessionExpired();
            throw new Error('Session expired. Please login again.');
        }
    }

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // Handle 401 - token expired or invalid, attempt refresh
    if (response.status === 401) {
        console.warn('Authentication failed - attempting token refresh');
        const currentRefreshToken = await getRefreshToken();
        
        if (!currentRefreshToken) {
            await clearAuthData();
            if (onSessionExpired) onSessionExpired();
            throw new Error('Session expired');
        }

        try {
            const refreshResponse = await fetch(`${API_URL}/users/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: currentRefreshToken }),
            });

            if (!refreshResponse.ok) {
                await clearAuthData();
                if (onSessionExpired) onSessionExpired();
                throw new Error('Session expired. Please login again.');
            }

            const { access } = await refreshResponse.json();
            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);

            // Retry original request with the new access token
            return fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access}`,
                    ...options.headers,
                },
            });
        } catch (err) {
            await clearAuthData();
            if (onSessionExpired) onSessionExpired();
            throw new Error('Session expired. Please login again.');
        }
    }

    return response;
};

// ==================== CUSTOMER PROFILE ====================
export const getCustomerProfile = async () => {
    const response = await authFetch('/customers/profile/');
    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch profile');
    }
    return response.json();
};

export const updateCustomerProfile = async (profileData: {
    full_name?: string;
    email?: string;
    saved_address?: string;
    saved_latitude?: number;
    saved_longitude?: number;
    is_kyc_verified?: boolean;
}) => {
    const response = await authFetch('/customers/profile/', {
        method: 'POST',
        body: JSON.stringify(profileData),
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
};

// ==================== FAVORITES ====================
export const getFavorites = async () => {
    const response = await authFetch('/customers/favorites/');
    if (!response.ok) throw new Error('Failed to fetch favorites');
    return response.json();
};

export const toggleFavorite = async (bikeId: number) => {
    const response = await authFetch('/customers/favorites/', {
        method: 'POST',
        body: JSON.stringify({ bike_id: bikeId }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle favorite');
    }
    return response.json();
};

export const addFavorite = async (bikeId: number) => {
    const response = await authFetch('/customers/favorites/', {
        method: 'POST',
        body: JSON.stringify({ bike_id: bikeId }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add favorite');
    }
    return response.json();
};

export const removeFavorite = async (bikeId: number) => {
    const response = await authFetch(`/customers/favorites/${bikeId}/`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to remove favorite');
    }
    return { success: true };
};

// ==================== REVIEWS ====================
export const submitReview = async (reviewData: {
    bookingId: number;
    rating: number;
    comment?: string;
}) => {
    const response = await authFetch('/customers/reviews/', {
        method: 'POST',
        body: JSON.stringify({
            booking: reviewData.bookingId,
            rating: reviewData.rating,
            comment: reviewData.comment || '',
        }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.booking?.[0] || error.error || 'Failed to submit review');
    }
    return response.json();
};

export const getBikeReviews = async (bikeId: number) => {
    const response = await authFetch(`/customers/reviews/bike/${bikeId}/`);
    if (!response.ok) throw new Error('Failed to fetch reviews');
    return response.json();
};

// ==================== NOTIFICATIONS ====================
export const getNotifications = async () => {
    const response = await authFetch('/customers/notifications/');
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
};

export const markNotificationRead = async (notificationId: number) => {
    const response = await authFetch(`/customers/notifications/${notificationId}/read/`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to mark as read');
    return response.json();
};

export const markAllNotificationsRead = async () => {
    const response = await authFetch('/customers/notifications/read-all/', {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to mark all as read');
    return response.json();
};

// ==================== DASHBOARD ====================
export const getCustomerDashboard = async () => {
    const response = await authFetch('/customers/dashboard/');
    if (!response.ok) throw new Error('Failed to fetch dashboard');
    return response.json();
};

// ==================== BOOKINGS ====================
export const getBookings = async (filter?: string) => {
    let endpoint = '/bookings/';
    if (filter) {
        endpoint += `?filter=${filter}`;
    }
    const response = await authFetch(endpoint);
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return response.json();
};

export const getBookingDetails = async (bookingId: string | number) => {
    const response = await authFetch(`/bookings/${bookingId}/`);
    if (!response.ok) throw new Error('Failed to fetch booking details');
    return response.json();
};

export const createBooking = async (bikeId: number, startTime: string, endTime: string) => {
    const response = await authFetch('/bookings/', {
        method: 'POST',
        body: JSON.stringify({ bike: bikeId, start_time: startTime, end_time: endTime }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.non_field_errors?.[0] || error.error || 'Failed to create booking');
    }
    return response.json();
};

export const cancelBooking = async (bookingId: number, reason: string = 'Cancelled by user') => {
    const response = await authFetch(`/bookings/${bookingId}/cancel/`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel booking');
    }
    return response.json();
};

export const getBookingQRCode = async (bookingId: string | number) => {
    const response = await authFetch(`/bookings/${bookingId}/qr-code/`);
    if (!response.ok) throw new Error('Failed to get QR code');
    return response.json();
};

// ==================== BIKES ====================
export const getBikes = async (params?: {
    category?: number;
    category_name?: string;
    min_price?: number;
    max_price?: number;
    min_rating?: number;
    search?: string;
    sort_by?: 'price_low' | 'price_high' | 'rating' | 'newest';
    lat?: number;
    lng?: number;
    radius?: number;
    limit?: number;
}) => {
    let endpoint = '/inventory/bikes/';
    if (params) {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });
        const queryString = queryParams.toString();
        if (queryString) endpoint += `?${queryString}`;
    }

    const response = await authFetch(endpoint);
    if (!response.ok) throw new Error('Failed to fetch bikes');
    const data = await response.json();
    return Array.isArray(data) ? data : data.results || [];
};

export const getBikeDetails = async (bikeId: string) => {
    const response = await authFetch(`/inventory/bikes/${bikeId}/`);
    if (!response.ok) throw new Error('Failed to fetch bike details');
    return response.json();
};

export const getCategories = async () => {
    const response = await authFetch('/inventory/categories/');
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
};

// ==================== PAYMENTS ====================
export const createOrder = async (bookingId: number) => {
    const response = await authFetch('/payments/create-order/', {
        method: 'POST',
        body: JSON.stringify({ booking_id: bookingId }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment order');
    }
    return response.json();
};

export const verifyPayment = async (paymentDetails: {
    bookingId: number;
    orderId: string;
    paymentId: string;
    signature: string;
}) => {
    const response = await authFetch('/payments/verify-payment/', {
        method: 'POST',
        body: JSON.stringify({
            booking_id: paymentDetails.bookingId,
            razorpay_order_id: paymentDetails.orderId,
            razorpay_payment_id: paymentDetails.paymentId,
            razorpay_signature: paymentDetails.signature,
        }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify payment');
    }
    return response.json();
};

// ==================== NOTIFICATIONS / FCM ====================
export const updateFCMToken = async (fcmToken: string) => {
    const response = await authFetch('/users/fcm-token/', {
        method: 'POST',
        body: JSON.stringify({ fcm_token: fcmToken }),
    });
    if (!response.ok) throw new Error('Failed to update FCM token');
    return response.json();
};

export const getRecommendations = async (lat: number, lng: number) => {
    const response = await authFetch(`/inventory/bikes/recommendations/?lat=${lat}&lng=${lng}`);
    if (!response.ok) throw new Error('Failed to fetch recommendations');
    return response.json();
};

