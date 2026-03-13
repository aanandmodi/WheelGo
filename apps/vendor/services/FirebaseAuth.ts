/**
 * Firebase Authentication Service for Vendor App
 * Handles Phone OTP authentication
 */

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

type ConfirmationResult = FirebaseAuthTypes.ConfirmationResult;

let confirmationResult: ConfirmationResult | null = null;

/**
 * Send OTP to phone number
 */
export const sendOTP = async (phoneNumber: string): Promise<void> => {
    try {
        const formattedPhone = phoneNumber.startsWith('+')
            ? phoneNumber
            : `+91${phoneNumber}`;

        confirmationResult = await auth().signInWithPhoneNumber(formattedPhone);
        console.log('OTP sent to', formattedPhone);
    } catch (error: any) {
        console.error('Error sending OTP:', error);
        throw new Error(error.message || 'Failed to send OTP');
    }
};

/**
 * Verify OTP and get Firebase token
 */
export const verifyOTP = async (code: string): Promise<string> => {
    try {
        if (!confirmationResult) {
            throw new Error('Please request OTP first');
        }

        await confirmationResult.confirm(code);

        const currentUser = auth().currentUser;
        if (!currentUser) {
            throw new Error('Authentication failed');
        }

        return await currentUser.getIdToken();
    } catch (error: any) {
        console.error('Error verifying OTP:', error);
        throw new Error(error.message || 'Invalid OTP');
    }
};

/**
 * Get current Firebase ID token
 */
export const getFirebaseToken = async (): Promise<string | null> => {
    try {
        const currentUser = auth().currentUser;
        if (!currentUser) return null;
        return await currentUser.getIdToken();
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
};

/**
 * Sign out
 */
export const signOut = async (): Promise<void> => {
    await auth().signOut();
    confirmationResult = null;
};

/**
 * Auth state listener
 */
export const onAuthStateChanged = (
    callback: (user: FirebaseAuthTypes.User | null) => void
): (() => void) => {
    return auth().onAuthStateChanged(callback);
};

export const getCurrentUserPhone = (): string | null => {
    return auth().currentUser?.phoneNumber || null;
};
