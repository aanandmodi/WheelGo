import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, View, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { VendorApiService } from '@/constants/ApiService';

export default function ScanQRScreen() {
    const { token } = useAuth();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [bookingDetails, setBookingDetails] = useState<any>(null);

    useEffect(() => {
        requestCameraPermission();
    }, []);

    const requestCameraPermission = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
    };

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (scanned || processing) return;

        setScanned(true);
        setProcessing(true);

        try {
            // Call backend to validate and start the ride
            const result = await VendorApiService.scanQR(data);
            setBookingDetails(result);
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.message || 'Failed to start ride. Please try again.',
                [
                    {
                        text: 'Try Again',
                        onPress: () => {
                            setScanned(false);
                            setProcessing(false);
                        },
                    },
                    {
                        text: 'Cancel',
                        onPress: () => router.back(),
                        style: 'cancel',
                    },
                ]
            );
        } finally {
            setProcessing(false);
        }
    };

    if (hasPermission === null) {
        return (
            <SafeAreaView className="flex-1 bg-primary items-center justify-center">
                <ActivityIndicator size="large" color="#FFC72C" />
                <Text className="text-white mt-4 font-medium">Requesting camera permission...</Text>
            </SafeAreaView>
        );
    }

    if (hasPermission === false) {
        return (
            <SafeAreaView className="flex-1 bg-primary items-center justify-center px-6">
                <View className="h-20 w-20 bg-red-500/10 rounded-full items-center justify-center mb-6">
                    <MaterialIcons name="no-photography" size={40} color="#EF4444" />
                </View>
                <Text className="text-white font-bold text-xl text-center">Camera Access Required</Text>
                <Text className="text-gray-400 text-center mt-2">
                    Please allow camera access in your device settings to scan QR codes.
                </Text>
                <TouchableOpacity
                    onPress={requestCameraPermission}
                    className="mt-8 bg-secondary px-8 py-4 rounded-full shadow-lg shadow-gray-950/15"
                >
                    <Text className="text-gray-900 font-bold text-base">Request Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mt-4 p-2"
                >
                    <Text className="text-gray-400 font-semibold">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    if (bookingDetails) {
        return (
            <SafeAreaView className="flex-1 bg-primary justify-center px-6">
                <View className="bg-white p-8 rounded-3xl items-center shadow-2xl">
                    <View className="h-20 w-20 bg-emerald-100 rounded-full items-center justify-center mb-6">
                        <MaterialIcons name="check-circle" size={48} color="#10B981" />
                    </View>
                    <Text className="text-gray-900 font-bold text-2xl mb-1 text-center">Ride Started</Text>
                    <Text className="text-gray-500 text-sm text-center mb-6">Booking #{bookingDetails.booking_id}</Text>

                    <View className="w-full mb-8 bg-gray-50 p-5 rounded-2xl border border-gray-150">
                        <View className="flex-row justify-between py-2.5 border-b border-gray-200">
                            <Text className="text-gray-500 text-sm">Customer</Text>
                            <Text className="text-gray-900 font-semibold text-sm">{bookingDetails.customer_name}</Text>
                        </View>
                        <View className="flex-row justify-between py-2.5 border-b border-gray-200">
                            <Text className="text-gray-500 text-sm">Vehicle</Text>
                            <Text className="text-gray-900 font-semibold text-sm">{bookingDetails.bike_name}</Text>
                        </View>
                        <View className="flex-row justify-between py-2.5">
                            <Text className="text-gray-500 text-sm">Drop-off Time</Text>
                            <Text className="text-gray-900 font-semibold text-sm">
                                {new Date(bookingDetails.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        className="w-full bg-primary py-4 rounded-full shadow-lg shadow-gray-950/15 items-center"
                        onPress={() => router.replace('/(tabs)/bookings')}
                    >
                        <Text className="text-white font-bold text-lg">Go to Bookings</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-black">
            {/* Camera View */}
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
            />

            {/* Overlay */}
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center px-4 py-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="h-10 w-10 bg-black/60 rounded-full items-center justify-center border border-white/10"
                    >
                        <MaterialIcons name="arrow-back" size={20} color="white" />
                    </TouchableOpacity>
                    <Text className="flex-1 text-center text-white text-lg font-bold pr-10">Scan QR Code</Text>
                </View>

                {/* Scanner Frame */}
                <View className="flex-1 items-center justify-center">
                    <View className="w-64 h-64 relative">
                        {/* Corner decorations in secondary color (Taxi Gold) */}
                        <View className="absolute top-0 left-0 w-10 h-10 border-l-4 border-t-4 border-secondary rounded-tl-lg" />
                        <View className="absolute top-0 right-0 w-10 h-10 border-r-4 border-t-4 border-secondary rounded-tr-lg" />
                        <View className="absolute bottom-0 left-0 w-10 h-10 border-l-4 border-b-4 border-secondary rounded-bl-lg" />
                        <View className="absolute bottom-0 right-0 w-10 h-10 border-r-4 border-b-4 border-secondary rounded-br-lg" />

                        {/* Processing indicator */}
                        {processing && (
                            <View className="absolute inset-0 bg-black/70 items-center justify-center rounded-lg">
                                <ActivityIndicator size="large" color="#FFC72C" />
                                <Text className="text-white mt-2 font-medium">Processing...</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Instructions */}
                <View className="px-6 pb-10">
                    <View className="bg-black/75 rounded-2xl p-5 border border-white/10">
                        <Text className="text-white text-center font-bold text-lg mb-2">
                            Position QR Code in Frame
                        </Text>
                        <Text className="text-gray-300 text-center text-sm">
                            Ask the customer to show their booking QR code. The ride will start automatically when scanned.
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}
