/**
 * Firebase Storage Service for Vendor App
 * Handles bike image uploads
 */

import storage from '@react-native-firebase/storage';

/**
 * Upload a bike image
 */
export const uploadBikeImage = async (
    localUri: string,
    bikeId: string
): Promise<string> => {
    try {
        const filename = `${Date.now()}.jpg`;
        const reference = storage().ref(`bikes/${bikeId}/${filename}`);

        await reference.putFile(localUri);
        return await reference.getDownloadURL();
    } catch (error: any) {
        console.error('Error uploading image:', error);
        throw new Error(error.message || 'Failed to upload image');
    }
};

/**
 * Upload multiple bike images
 */
export const uploadMultipleBikeImages = async (
    localUris: string[],
    bikeId: string
): Promise<string[]> => {
    const uploadPromises = localUris.map((uri) => uploadBikeImage(uri, bikeId));
    return await Promise.all(uploadPromises);
};

/**
 * Delete an image
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
    try {
        const reference = storage().refFromURL(imageUrl);
        await reference.delete();
    } catch (error) {
        console.error('Error deleting image:', error);
    }
};
