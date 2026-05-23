import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, View, ActivityIndicator, Image, TouchableOpacity, Linking } from 'react-native';
import { getBookingQRCode } from '@/constants/ApiService';

export default function QRCodeScreen() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
    const [loading, setLoading] = useState(true);
    const [qrData, setQrData] = useState<{
        qr_code_data: string;
        qr_code_image: string | null;
        booking_id: number;
        status: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchQRCode();
    }, [bookingId]);

    const fetchQRCode = async () => {
        if (!bookingId) {
            setError('No booking specified');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await getBookingQRCode(bookingId);
            setQrData(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load QR code');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#0F766E" />
                <Text className="text-gray-500 mt-2">Loading QR code...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
                <MaterialIcons name="error-outline" size={60} color="#EF4444" />
                <Text className="text-gray-800 font-bold text-lg mt-4 text-center">Unable to load QR code</Text>
                <Text className="text-gray-500 text-center mt-2">{error}</Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mt-6 bg-primary px-6 py-3 rounded-full"
                >
                    <Text className="text-white font-bold">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center -ml-2">
                    <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text className="flex-1 text-center text-lg font-bold text-gray-800 pr-10">Your QR Code</Text>
            </View>

            <View className="flex-1 items-center justify-center px-6">
                {/* Status Badge */}
                <View className={`px-4 py-2 rounded-full mb-8 ${qrData?.status === 'confirmed' ? 'bg-green-100' : 'bg-blue-100'}`}>
                    <Text className={`font-bold uppercase ${qrData?.status === 'confirmed' ? 'text-green-700' : 'text-blue-700'}`}>
                        {qrData?.status === 'confirmed' ? 'Ready to Ride' : qrData?.status}
                    </Text>
                </View>

                {/* QR Code */}
                <View className="bg-white p-4 rounded-3xl shadow-xl border border-gray-100">
                    {qrData?.qr_code_image ? (
                        <Image
                            source={{ uri: qrData.qr_code_image }}
                            className="w-64 h-64"
                            resizeMode="contain"
                        />
                    ) : (
                        <View className="w-64 h-64 bg-gray-100 items-center justify-center rounded-2xl">
                            <MaterialIcons name="qr-code-2" size={80} color="#94A3B8" />
                            <Text className="text-gray-400 mt-2">QR code not available</Text>
                        </View>
                    )}
                </View>

                {/* Instructions */}
                <View className="mt-8 px-8">
                    <Text className="text-center text-gray-800 font-bold text-lg mb-2">
                        Show this to the vendor
                    </Text>
                    <Text className="text-center text-gray-500">
                        The vendor will scan this QR code to start your ride. Make sure your phone screen is bright enough.
                    </Text>
                </View>

                {/* Booking ID */}
                <View className="mt-6 bg-gray-50 px-6 py-3 rounded-full">
                    <Text className="text-gray-500 text-sm">
                        Booking ID: <Text className="font-bold text-gray-800">#{bookingId}</Text>
                    </Text>
                </View>
            </View>

            {/* Footer */}
            <View className="p-4 border-t border-gray-100">
                <TouchableOpacity
                    onPress={() => router.push({ pathname: '/ride/summary', params: { id: bookingId } })}
                    className="bg-primary py-4 rounded-full items-center"
                >
                    <Text className="text-white font-bold">View Booking Details</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
