import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { getBookingDetails, cancelBooking } from '@/constants/ApiService';

interface BookingDetails {
    id: number;
    bike: number;
    bike_brand: string;
    bike_model: string;
    bike_image: string | null;
    bike_number_plate: string;
    vendor_name: string;
    vendor_phone: string;
    vendor_address: string;
    start_time: string;
    end_time: string;
    duration_hours: number;
    total_amount: string;
    status: string;
    payment_status: string;
    qr_code_image: string | null;
    can_cancel: boolean;
    can_review: boolean;
    actual_end_time: string | null;
    created_at: string;
}

export default function RideSummaryScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookingDetails();
    }, [id]);

    const fetchBookingDetails = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const data = await getBookingDetails(parseInt(id));
            setBooking(data);
        } catch (error) {
            console.error('Failed to fetch booking:', error);
            Alert.alert('Error', 'Failed to load booking details');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async () => {
        if (!booking) return;

        Alert.alert(
            'Cancel Booking',
            'Are you sure you want to cancel this booking?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await cancelBooking(booking.id);
                            Alert.alert('Cancelled', 'Your booking has been cancelled');
                            fetchBookingDetails();
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to cancel booking');
                        }
                    }
                }
            ]
        );
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'text-green-600';
            case 'pending': return 'text-yellow-600';
            case 'active': return 'text-blue-600';
            case 'completed': return 'text-gray-600';
            case 'cancelled': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#0F766E" />
                <Text className="text-gray-500 mt-2">Loading booking...</Text>
            </SafeAreaView>
        );
    }

    if (!booking) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <MaterialIcons name="error-outline" size={60} color="#E2E8F0" />
                <Text className="text-gray-500 mt-4">Booking not found</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-primary px-6 py-2 rounded-full">
                    <Text className="text-white font-bold">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />
            <View className="flex-1">
                {/* Header */}
                <View className="flex-row items-center p-4 pb-2 justify-between sticky top-0 bg-white z-10">
                    <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full">
                        <MaterialIcons name="arrow-back" size={24} color="#1F1F1F" />
                    </TouchableOpacity>
                    <Text className="text-lg font-semibold text-[#1F1F1F] flex-1 text-center">Booking Details</Text>
                    <View className="w-10" />
                </View>

                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    {/* Status Badge */}
                    <View className="items-center mb-4">
                        <View className={`px-4 py-2 rounded-full ${booking.status === 'completed' ? 'bg-green-100' : booking.status === 'cancelled' ? 'bg-red-100' : 'bg-blue-100'}`}>
                            <Text className={`font-bold uppercase ${getStatusColor(booking.status)}`}>
                                {booking.status}
                            </Text>
                        </View>
                    </View>

                    {/* Vehicle Info */}
                    <View className="flex-row items-center gap-4 rounded-2xl border border-gray-200 p-4 mb-4">
                        <Image
                            source={{ uri: booking.bike_image || 'https://via.placeholder.com/150' }}
                            className="h-16 w-16 rounded-xl bg-gray-200"
                            resizeMode="cover"
                        />
                        <View className="flex-1">
                            <Text className="text-[#1F1F1F] text-base font-semibold">{booking.bike_brand} {booking.bike_model}</Text>
                            <Text className="text-[#6B6B6B] text-sm font-medium">{booking.bike_number_plate}</Text>
                        </View>
                    </View>

                    {/* Vendor Info */}
                    <View className="rounded-2xl border border-gray-200 p-4 mb-4">
                        <Text className="text-[#1F1F1F] text-base font-semibold mb-3">Pickup Location</Text>
                        <View className="flex-row items-center gap-3">
                            <View className="h-10 w-10 bg-primary/10 rounded-full items-center justify-center">
                                <MaterialIcons name="store" size={20} color="#0F766E" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-[#1F1F1F] font-medium">{booking.vendor_name}</Text>
                                <Text className="text-[#6B6B6B] text-sm">{booking.vendor_address}</Text>
                            </View>
                        </View>
                        {booking.vendor_phone && (
                            <TouchableOpacity className="flex-row items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                <MaterialIcons name="phone" size={18} color="#0F766E" />
                                <Text className="text-primary font-medium">{booking.vendor_phone}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Time Details */}
                    <View className="flex-row gap-3 mb-4">
                        <View className="flex-1 gap-1.5 rounded-2xl p-4 border border-gray-200">
                            <Text className="text-[#6B6B6B] text-sm font-medium">Start Time</Text>
                            <Text className="text-[#1F1F1F] text-sm font-bold">{formatDateTime(booking.start_time)}</Text>
                        </View>
                        <View className="flex-1 gap-1.5 rounded-2xl p-4 border border-gray-200">
                            <Text className="text-[#6B6B6B] text-sm font-medium">End Time</Text>
                            <Text className="text-[#1F1F1F] text-sm font-bold">{formatDateTime(booking.end_time)}</Text>
                        </View>
                    </View>

                    {/* Duration & Cost */}
                    <View className="flex-col gap-2 rounded-2xl border border-gray-200 p-4">
                        <Text className="text-[#1F1F1F] text-base font-semibold leading-tight pb-2">Cost Details</Text>

                        <View className="flex-row justify-between py-2">
                            <Text className="text-[#6B6B6B] text-sm font-normal">Duration</Text>
                            <Text className="text-[#1F1F1F] text-sm font-normal">{booking.duration_hours} hours</Text>
                        </View>
                        <View className="flex-row justify-between py-2">
                            <Text className="text-[#6B6B6B] text-sm font-normal">Payment Status</Text>
                            <Text className={`text-sm font-medium ${booking.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                                {booking.payment_status.toUpperCase()}
                            </Text>
                        </View>

                        <View className="flex-row justify-between py-2 border-t border-gray-200 mt-2 pt-2">
                            <Text className="text-[#00897B] text-base font-semibold">Total Amount</Text>
                            <Text className="text-[#00897B] text-lg font-bold">₹{booking.total_amount}</Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Footer Actions */}
                <View className="p-4 pt-2 border-t border-gray-100 bg-white">
                    {/* Show QR Code for confirmed bookings */}
                    {(booking.status === 'confirmed' || booking.status === 'active') && (
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/booking/qrcode', params: { bookingId: booking.id } })}
                            className="h-14 w-full rounded-full bg-primary items-center justify-center mb-3 flex-row"
                        >
                            <MaterialIcons name="qr-code-2" size={24} color="white" />
                            <Text className="text-white font-semibold text-base ml-2">Show QR Code</Text>
                        </TouchableOpacity>
                    )}
                    {booking.can_cancel && (
                        <TouchableOpacity
                            onPress={handleCancelBooking}
                            className="h-14 w-full rounded-full bg-red-500 items-center justify-center mb-3"
                        >
                            <Text className="text-white font-semibold text-base">Cancel Booking</Text>
                        </TouchableOpacity>
                    )}
                    {booking.can_review && (
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/ride/feedback', params: { bookingId: booking.id, bikeId: booking.bike } })}
                            className="h-14 w-full rounded-full bg-[#00897B] items-center justify-center"
                        >
                            <Text className="text-white font-semibold text-base">Leave a Review</Text>
                        </TouchableOpacity>
                    )}
                    {!booking.can_cancel && !booking.can_review && booking.status !== 'confirmed' && booking.status !== 'active' && (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="h-14 w-full rounded-full bg-[#00897B] items-center justify-center"
                        >
                            <Text className="text-white font-semibold text-base">Done</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}
