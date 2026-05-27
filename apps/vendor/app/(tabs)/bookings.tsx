import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, SafeAreaView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import { VendorApiService } from '@/constants/ApiService';
import { useFocusEffect, useRouter } from 'expo-router';

export default function BookingRequestsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [statusFilter, setStatusFilter] = useState('Pending');
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const fetchBookings = async () => {
                try {
                    const data = await VendorApiService.getVendorBookings();
                    if (Array.isArray(data)) {
                        setRequests(data);
                    } else if (data && Array.isArray(data.results)) {
                        setRequests(data.results);
                    } else {
                        setRequests([]);
                    }
                } catch (error) {
                    console.error('Failed to fetch bookings', error);
                    setRequests([]);
                } finally {
                    setLoading(false);
                }
            };

            if (token) fetchBookings();
        }, [token])
    );

    const filteredRequests = statusFilter === 'All' ? requests : requests.filter((r: any) =>
        statusFilter === 'Pending' ? r.status === 'pending' :
            statusFilter === 'Confirmed' ? r.status === 'confirmed' :
                statusFilter === 'Active' ? r.status === 'active' :
                    r.status !== 'pending'
    );

    const handleAction = async (id: number, action: 'accept' | 'reject') => {
        try {
            let data;
            if (action === 'accept') {
                data = await VendorApiService.acceptBooking(id.toString());
            } else {
                data = await VendorApiService.rejectBooking(id.toString(), 'Rejected by vendor');
            }

            // Update local state to reflect change
            setRequests(prev => prev.map((r: any) =>
                r.id === id ? { ...r, status: action === 'accept' ? 'confirmed' : 'cancelled' } : r
            ));
            alert(data.message || `Booking ${action}ed!`);
        } catch (error: any) {
            console.error(`Failed to ${action} booking`, error);
            alert(error.message || `Failed to ${action} booking`);
        }
    };

    const handleCompleteRide = async (id: number) => {
        try {
            const data = await VendorApiService.completeBooking(id.toString());
            // Update local state to reflect change
            setRequests(prev => prev.map((r: any) =>
                r.id === id ? { ...r, status: 'completed' } : r
            ));
            alert(data.message || 'Ride completed successfully!');
        } catch (error: any) {
            console.error('Failed to complete booking', error);
            alert(error.message || 'Failed to complete booking');
        }
    };

    const getStatusBadgeStyle = (status: string) => {
        switch (status) {
            case 'pending': return { bg: 'bg-orange-100', text: 'text-orange-700' };
            case 'confirmed': return { bg: 'bg-green-100', text: 'text-green-700' };
            case 'active': return { bg: 'bg-blue-100', text: 'text-blue-700' };
            case 'completed': return { bg: 'bg-gray-100', text: 'text-gray-700' };
            case 'cancelled': return { bg: 'bg-red-100', text: 'text-red-700' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700' };
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const statusStyle = getStatusBadgeStyle(item.status);
        const bikeName = item.bike_brand && item.bike_model ? `${item.bike_brand} ${item.bike_model}` : (item.bike_name || 'Vehicle');
        const customerInfo = item.customer_name || item.customer_phone || (item.user ? `User #${item.user}` : 'Customer');

        return (
            <Animated.View 
                entering={FadeInDown.duration(400).springify()}
                className="bg-white rounded-2xl p-4 shadow-sm border border-border mb-4"
            >
                <View className="flex-row gap-4">
                    <Image
                        source={{ uri: item.bike_image || 'https://via.placeholder.com/150' }}
                        className="h-20 w-20 rounded-xl bg-gray-100"
                        resizeMode="cover"
                    />
                    <View className="flex-1 justify-between">
                        <View>
                            <View className="flex-row justify-between items-start">
                                <Text className="text-[#0F1115] font-bold text-base flex-1 mr-2" numberOfLines={1}>{bikeName}</Text>
                                <View className={`px-2.5 py-0.5 rounded-md ${statusStyle.bg}`}>
                                    <Text className={`${statusStyle.text} font-bold text-[9px] uppercase tracking-wide`}>{item.status}</Text>
                                </View>
                            </View>
                            <Text className="text-gray-500 text-xs mt-1">Customer: {customerInfo}</Text>
                        </View>
                        <View className="flex-row justify-between items-end mt-2">
                            <Text className="text-gray-400 font-medium text-xs">{item.start_time ? new Date(item.start_time).toLocaleDateString() : 'Date'}</Text>
                            <Text className="text-primary font-bold text-lg">₹{item.total_amount}</Text>
                        </View>
                    </View>
                </View>

                {/* Actions based on status */}
                {item.status === 'pending' && (
                    <View className="flex-row gap-3 pt-4 mt-3 border-t border-gray-100">
                        <TouchableOpacity
                            className="flex-1 py-3 rounded-full border border-gray-200 bg-transparent items-center justify-center"
                            onPress={() => handleAction(item.id, 'reject')}
                        >
                            <Text className="text-gray-500 font-bold text-sm">Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 py-3 rounded-full bg-primary items-center justify-center shadow-md shadow-gray-950/15"
                            onPress={() => handleAction(item.id, 'accept')}
                        >
                            <Text className="text-white font-bold text-sm">Accept Request</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Scan QR button for confirmed bookings */}
                {item.status === 'confirmed' && (
                    <View className="pt-4 mt-3 border-t border-gray-100">
                        <TouchableOpacity
                            className="py-3 rounded-full bg-secondary items-center justify-center flex-row shadow-sm"
                            onPress={() => router.push('/scan-qr')}
                        >
                            <MaterialIcons name="qr-code-scanner" size={18} color="#0F1115" />
                            <Text className="text-[#0F1115] font-bold text-sm ml-2">Scan QR to Start Ride</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Active ride indicator & Complete Ride Button */}
                {item.status === 'active' && (
                    <View className="flex-row gap-3 pt-4 mt-3 border-t border-gray-100">
                        <View className="flex-1 py-3 rounded-full bg-gray-100 items-center justify-center flex-row">
                            <MaterialIcons name="directions-bike" size={18} color="#0F1115" />
                            <Text className="text-[#0F1115] font-bold text-sm ml-2">Active Ride</Text>
                        </View>
                        <TouchableOpacity
                            className="flex-1 py-3 rounded-full bg-primary items-center justify-center shadow-sm"
                            onPress={() => handleCompleteRide(item.id)}
                        >
                            <Text className="text-white font-bold text-sm">Complete Ride</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Animated.View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex-1 px-4">
                <View className="py-4">
                    <Text className="text-2xl font-bold text-[#0F1115]">Bookings</Text>
                </View>

                <View className="flex-row gap-2 mb-4 flex-wrap">
                    {['Pending', 'Confirmed', 'Active', 'All'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setStatusFilter(tab)}
                            className={`px-4 py-2 rounded-full border ${statusFilter === tab
                                ? 'bg-primary border-primary'
                                : 'bg-transparent border-gray-250'
                                }`}
                        >
                            <Text className={`font-semibold text-sm ${statusFilter === tab
                                ? 'text-white'
                                : 'text-gray-500'
                                }`}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#0F1115" />
                ) : (
                    <FlatList
                        data={filteredRequests}
                        renderItem={renderItem}
                        keyExtractor={(item: any) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20">
                                <Text className="text-gray-400">No requests found</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
