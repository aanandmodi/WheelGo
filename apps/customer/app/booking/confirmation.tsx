import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View, ActivityIndicator, Alert, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { getBookingDetails } from '@/constants/ApiService';

export default function BookingConfirmation() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!bookingId) {
                setLoading(false);
                return;
            }
            try {
                const data = await getBookingDetails(bookingId);
                setBooking(data);
            } catch (err: any) {
                console.error("Failed to load booking details on confirmation screen:", err);
                Alert.alert("Error", "Failed to retrieve booking confirmation details.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [bookingId]);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-[#F5F5F5] dark:bg-[#121212] items-center justify-center">
                <ActivityIndicator size="large" color="#00897B" />
                <Text className="text-gray-500 mt-2 font-medium">Loading confirmation details...</Text>
            </SafeAreaView>
        );
    }

    if (!booking) {
        return (
            <SafeAreaView className="flex-1 bg-[#F5F5F5] dark:bg-[#121212] items-center justify-center px-6">
                <MaterialIcons name="error-outline" size={60} color="#EF4444" />
                <Text className="text-gray-800 dark:text-white font-bold text-lg mt-4 text-center">Booking not found</Text>
                <TouchableOpacity onPress={() => router.replace('/(tabs)')} className="mt-6 bg-[#00897B] px-6 py-3 rounded-full">
                    <Text className="text-white font-bold">Go Home</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const dateStart = new Date(booking.start_time);
    const dateEnd = new Date(booking.end_time);
    
    const formattedDates = `${dateStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${dateStart.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - ${dateEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${dateEnd.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

    const handleGetDirections = () => {
        if (booking.vendor_latitude && booking.vendor_longitude) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${booking.vendor_latitude},${booking.vendor_longitude}`;
            Linking.openURL(url).catch(err => console.error("Failed to open directions:", err));
        } else {
            Alert.alert("Directions Unavailable", "GPS coordinates for this shop are not set.");
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F5F5F5] dark:bg-[#121212]">
            <View className="flex-1">
                {/* Header */}
                <View className="flex-row items-center p-4 bg-white dark:bg-[#1E1E1E] shadow-sm">
                    <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center">
                        <MaterialIcons name="arrow-back" size={24} color="#212121" />
                    </TouchableOpacity>
                    <Text className="flex-1 text-center text-lg font-semibold text-[#212121] dark:text-white pr-10">Booking Confirmation</Text>
                </View>

                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
                    {/* Confirmation Card */}
                    <View className="bg-white dark:bg-[#1E1E1E] rounded-xl p-6 items-center shadow-md mb-6">
                        <View className="h-16 w-16 rounded-full bg-[#00897B] items-center justify-center mb-4">
                            <MaterialIcons name="check" size={32} color="white" />
                        </View>
                        <Text className="text-2xl font-bold text-[#212121] dark:text-white text-center mb-2">Your Booking is Confirmed!</Text>

                        {/* Dynamic QR Code display */}
                        {booking.qr_code_image ? (
                            <View className="w-full max-w-[240px] aspect-square bg-white rounded-xl border border-gray-200 mt-4 overflow-hidden p-2">
                                <Image
                                    source={{ uri: booking.qr_code_image }}
                                    className="w-full h-full rounded-lg"
                                    resizeMode="contain"
                                />
                            </View>
                        ) : (
                            <View className="w-full max-w-[240px] aspect-square bg-gray-50 dark:bg-gray-800 items-center justify-center rounded-xl border border-gray-200 mt-4">
                                <MaterialIcons name="qr-code-2" size={64} color="#94A3B8" />
                                <Text className="text-gray-400 mt-2 text-xs">QR Code Generating...</Text>
                            </View>
                        )}
                        <Text className="text-center text-gray-500 mt-4 text-sm px-4">Show this QR at the shop to pick up your vehicle.</Text>
                    </View>

                    {/* Pickup Details Map & Location */}
                    <View className="bg-white dark:bg-[#1E1E1E] rounded-xl p-5 mb-6 shadow-md gap-4">
                        <Text className="text-lg font-bold text-[#212121] dark:text-white">Pickup Details</Text>
                        
                        {/* Dynamic MapView instead of static placeholder image */}
                        {booking.vendor_latitude && booking.vendor_longitude ? (
                            <View className="w-full h-36 rounded-xl overflow-hidden border border-gray-100">
                                <MapView
                                    provider={PROVIDER_GOOGLE}
                                    style={{ flex: 1 }}
                                    initialRegion={{
                                        latitude: Number(booking.vendor_latitude),
                                        longitude: Number(booking.vendor_longitude),
                                        latitudeDelta: 0.005,
                                        longitudeDelta: 0.005,
                                    }}
                                    scrollEnabled={false}
                                >
                                    <Marker
                                        coordinate={{
                                            latitude: Number(booking.vendor_latitude),
                                            longitude: Number(booking.vendor_longitude),
                                        }}
                                        title={booking.vendor_name}
                                        description={booking.vendor_address}
                                    />
                                </MapView>
                            </View>
                        ) : (
                            <View className="w-full h-32 rounded-xl bg-gray-100 dark:bg-gray-800 items-center justify-center">
                                <MaterialIcons name="map" size={32} color="#94A3B8" />
                                <Text className="text-gray-400 text-xs mt-1">Map preview unavailable</Text>
                            </View>
                        )}

                        <View>
                            <Text className="font-semibold text-[#212121] dark:text-white">{booking.vendor_name}</Text>
                            <Text className="text-sm text-gray-500 mt-1">{booking.vendor_address}</Text>
                        </View>
                        
                        <TouchableOpacity 
                            className="flex-row items-center justify-center bg-[#00897B] py-3.5 rounded-full gap-2"
                            onPress={handleGetDirections}
                        >
                            <MaterialIcons name="navigation" size={20} color="white" />
                            <Text className="text-white font-semibold">Get Directions</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Booking Summary */}
                    <View className="bg-white dark:bg-[#1E1E1E] rounded-xl p-5 shadow-md gap-4">
                        <Text className="text-lg font-bold text-[#212121] dark:text-white">Your Booking</Text>
                        <View className="gap-3">
                            <View className="flex-row items-center gap-4">
                                <View className="h-10 w-10 items-center justify-center bg-[#00897B]/10 rounded-lg">
                                    <MaterialIcons name="two-wheeler" size={20} color="#00897B" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Vehicle</Text>
                                    <Text className="font-semibold text-[#212121] dark:text-white">{booking.bike_brand} {booking.bike_model}</Text>
                                </View>
                            </View>
                            <View className="flex-row items-center gap-4">
                                <View className="h-10 w-10 items-center justify-center bg-[#00897B]/10 rounded-lg">
                                    <MaterialIcons name="calendar-today" size={20} color="#00897B" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Pickup & Drop-off</Text>
                                    <Text className="font-semibold text-[#212121] dark:text-white" numberOfLines={2}>{formattedDates}</Text>
                                </View>
                            </View>
                            <View className="flex-row items-center gap-4">
                                <View className="h-10 w-10 items-center justify-center bg-[#00897B]/10 rounded-lg">
                                    <MaterialIcons name="receipt" size={20} color="#00897B" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Total Price</Text>
                                    <Text className="font-semibold text-[#212121] dark:text-white">₹ {booking.total_amount}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                </ScrollView>

                {/* Footer Actions */}
                <View className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#1E1E1E] border-t border-gray-200">
                    <TouchableOpacity onPress={() => router.push('/(tabs)/history')} className="w-full bg-[#00897B] py-3.5 rounded-full items-center">
                        <Text className="text-white font-semibold text-base">View My Bookings</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </SafeAreaView>
    );
}
