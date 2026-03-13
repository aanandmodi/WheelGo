import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './Api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_DATA_KEY = 'userData';

// Store tokens
export const storeTokens = async (accessToken: string, refreshToken: string) => {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

// Get access token
export const getAccessToken = async (): Promise<string | null> => {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
};

// Get refresh token
export const getRefreshToken = async (): Promise<string | null> => {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
};

// Store user data
export const storeUserData = async (userData: any) => {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
};

// Get user data
export const getUserData = async (): Promise<any | null> => {
    const data = await AsyncStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
};

// Clear all auth data
export const clearAuthData = async () => {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY]);
};

// Authenticated fetch wrapper
export const authFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const token = await getAccessToken();

    // Debug: log token status
    if (!token) {
        console.warn('No access token found - user may need to log in');
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

    // Handle 401 - token expired or invalid
    if (response.status === 401) {
        console.warn('Authentication failed - token may be expired or invalid');
        // Clear the invalid token
        await clearAuthData();
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
    if (!response.ok) throw new Error('Failed to remove favorite');
    return response.json();
};

// ==================== REVIEWS ====================
export const submitReview = async (bookingId: number, rating: number, comment: string = '') => {
    const response = await authFetch('/customers/reviews/', {
        method: 'POST',
        body: JSON.stringify({ booking: bookingId, rating, comment }),
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
export const getBookings = async (filter?: 'upcoming' | 'active' | 'past') => {
    let endpoint = '/bookings/';
    if (filter) {
        endpoint += `?filter=${filter}`;
    }
    const response = await authFetch(endpoint);
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return response.json();
};

export const getBookingDetails = async (bookingId: number) => {
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

export const getBookingQRCode = async (bookingId: number) => {
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

export const getBikeDetails = async (bikeId: number) => {
    const response = await authFetch(`/inventory/bikes/${bikeId}/`);
    if (!response.ok) throw new Error('Failed to fetch bike details');
    return response.json();
};

export const getCategories = async () => {
    const response = await authFetch('/inventory/categories/');
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
};
