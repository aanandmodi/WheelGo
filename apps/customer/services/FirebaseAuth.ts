/**
 * Firebase Authentication Service
 * Handles Phone OTP and Google Sign-In
 */

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Type for confirmation result
type ConfirmationResult = FirebaseAuthTypes.ConfirmationResult;

let confirmationResult: ConfirmationResult | null = null;

/**
 * Send OTP to phone number using Firebase Auth
 * @param phoneNumber - Phone number with country code (e.g., +91XXXXXXXXXX)
 */
export const sendOTP = async (phoneNumber: string): Promise<void> => {
    try {
        // Format phone number if needed
        const formattedPhone = phoneNumber.startsWith('+')
            ? phoneNumber
            : `+91${phoneNumber}`;

        confirmationResult = await auth().signInWithPhoneNumber(formattedPhone);
        console.log('OTP sent successfully to', formattedPhone);
    } catch (error: any) {
        console.error('Error sending OTP:', error);
        throw new Error(error.message || 'Failed to send OTP');
    }
};

/**
 * Verify OTP code
 * @param code - 6-digit OTP code
 * @returns Firebase ID token for backend authentication
 */
export const verifyOTP = async (code: string): Promise<string> => {
    try {
        if (!confirmationResult) {
            throw new Error('Please request OTP first');
        }

        await confirmationResult.confirm(code);

        // Get Firebase ID token to send to backend
        const currentUser = auth().currentUser;
        if (!currentUser) {
            throw new Error('Authentication failed');
        }

        const idToken = await currentUser.getIdToken();
        return idToken;
    } catch (error: any) {
        console.error('Error verifying OTP:', error);
        throw new Error(error.message || 'Invalid OTP');
    }
};

/**
 * Get current Firebase ID token (for API calls)
 */
export const getFirebaseToken = async (): Promise<string | null> => {
    try {
        const currentUser = auth().currentUser;
        if (!currentUser) return null;
        return await currentUser.getIdToken();
    } catch (error) {
        console.error('Error getting Firebase token:', error);
        return null;
    }
};

/**
 * Sign out from Firebase
 */
export const signOut = async (): Promise<void> => {
    try {
        await auth().signOut();
        confirmationResult = null;
    } catch (error: any) {
        console.error('Error signing out:', error);
        throw error;
    }
};

/**
 * Subscribe to authentication state changes
 */
export const onAuthStateChanged = (
    callback: (user: FirebaseAuthTypes.User | null) => void
): (() => void) => {
    return auth().onAuthStateChanged(callback);
};

/**
 * Get current user's phone number
 */
export const getCurrentUserPhone = (): string | null => {
    return auth().currentUser?.phoneNumber || null;
};
