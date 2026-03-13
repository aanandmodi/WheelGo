/**
 * Firebase Image Upload Service
 * Handles image uploads to Firebase Storage
 */

import storage from '@react-native-firebase/storage';

/**
 * Upload a bike image to Firebase Storage
 * @param localUri - Local file URI (from image picker)
 * @param bikeId - Bike ID for organizing storage
 * @returns Download URL of uploaded image
 */
export const uploadBikeImage = async (
    localUri: string,
    bikeId: string
): Promise<string> => {
    try {
        const filename = `${Date.now()}.jpg`;
        const reference = storage().ref(`bikes/${bikeId}/${filename}`);

        // Upload file
        await reference.putFile(localUri);

        // Get download URL
        const downloadURL = await reference.getDownloadURL();
        return downloadURL;
    } catch (error: any) {
        console.error('Error uploading image:', error);
        throw new Error(error.message || 'Failed to upload image');
    }
};

/**
 * Upload multiple bike images
 * @param localUris - Array of local file URIs
 * @param bikeId - Bike ID for organizing storage
 * @returns Array of download URLs
 */
export const uploadMultipleBikeImages = async (
    localUris: string[],
    bikeId: string
): Promise<string[]> => {
    try {
        const uploadPromises = localUris.map((uri) => uploadBikeImage(uri, bikeId));
        return await Promise.all(uploadPromises);
    } catch (error: any) {
        console.error('Error uploading images:', error);
        throw new Error(error.message || 'Failed to upload images');
    }
};

/**
 * Upload user profile photo
 * @param localUri - Local file URI
 * @param userId - User ID
 * @returns Download URL
 */
export const uploadProfilePhoto = async (
    localUri: string,
    userId: string
): Promise<string> => {
    try {
        const reference = storage().ref(`profiles/${userId}/avatar.jpg`);
        await reference.putFile(localUri);
        return await reference.getDownloadURL();
    } catch (error: any) {
        console.error('Error uploading profile photo:', error);
        throw new Error(error.message || 'Failed to upload profile photo');
    }
};

/**
 * Delete an image from storage
 * @param imageUrl - Full download URL of the image
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
    try {
        const reference = storage().refFromURL(imageUrl);
        await reference.delete();
    } catch (error: any) {
        console.error('Error deleting image:', error);
        // Don't throw - deletion failure shouldn't break the flow
    }
};
