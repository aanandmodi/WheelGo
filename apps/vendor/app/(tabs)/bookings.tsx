import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, SafeAreaView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/constants/Api';
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
                    const response = await fetch(`${API_URL}/bookings/`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    // Log status to debug
                    console.log('Bookings Status:', response.status);
                    const data = await response.json();

                    if (response.ok) {
                        if (Array.isArray(data)) {
                            setRequests(data);
                        } else {
                            console.error('Bookings API returned non-array:', data);
                            setRequests([]); // Fallback
                        }
                    } else {
                        console.error('Bookings API Error:', data);
                    }
                } catch (error) {
                    console.error('Failed to fetch bookings', error);
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
            const endpoint = action === 'accept'
                ? `${API_URL}/bookings/${id}/accept/`
                : `${API_URL}/bookings/${id}/reject/`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: action === 'reject' ? JSON.stringify({ reason: 'Rejected by vendor' }) : undefined
            });

            const data = await response.json();

            if (response.ok) {
                // Update local state to reflect change
                setRequests(prev => prev.map((r: any) =>
                    r.id === id ? { ...r, status: action === 'accept' ? 'confirmed' : 'cancelled' } : r
                ));
                alert(data.message || `Booking ${action}ed!`);
            } else {
                alert(data.error || `Failed to ${action} booking`);
            }
        } catch (error) {
            console.error(`Failed to ${action} booking`, error);
            alert(`Network error. Please try again.`);
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

        return (
            <View className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 mb-4">
                <View className="flex-row gap-4">
                    <Image
                        source={{ uri: item.bike_image || 'https://via.placeholder.com/150' }}
                        className="h-20 w-20 rounded-lg bg-gray-200"
                        resizeMode="cover"
                    />
                    <View className="flex-1 justify-between">
                        <View>
                            <View className="flex-row justify-between items-start">
                                <Text className="text-[#111817] dark:text-white font-bold text-base flex-1 mr-2">{item.bike_name || 'Bike'}</Text>
                                <View className={`px-2 py-0.5 rounded ${statusStyle.bg}`}>
                                    <Text className={`${statusStyle.text} font-bold text-[10px] uppercase`}>{item.status}</Text>
                                </View>
                            </View>
                            <Text className="text-gray-500 text-sm mt-1">Customer: {item.user || 'User'}</Text>
                        </View>
                        <View className="flex-row justify-between items-end mt-2">
                            <Text className="text-[#111817] dark:text-white font-medium text-sm">{item.start_time ? new Date(item.start_time).toLocaleDateString() : 'Date'}</Text>
                            <Text className="text-blue-600 font-bold text-lg">₹{item.total_amount}</Text>
                        </View>
                    </View>
                </View>

                {/* Actions based on status */}
                {item.status === 'pending' && (
                    <View className="flex-row gap-3 pt-4 mt-3 border-t border-gray-100 dark:border-gray-800">
                        <TouchableOpacity
                            className="flex-1 py-3 rounded-lg border border-red-100 bg-red-50 items-center justify-center"
                            onPress={() => handleAction(item.id, 'reject')}
                        >
                            <Text className="text-red-700 font-bold text-sm">Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 py-3 rounded-lg bg-blue-600 items-center justify-center shadow-lg shadow-blue-500/30"
                            onPress={() => handleAction(item.id, 'accept')}
                        >
                            <Text className="text-white font-bold text-sm">Accept Request</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Scan QR button for confirmed bookings */}
                {item.status === 'confirmed' && (
                    <View className="pt-4 mt-3 border-t border-gray-100 dark:border-gray-800">
                        <TouchableOpacity
                            className="py-3 rounded-lg bg-green-600 items-center justify-center flex-row"
                            onPress={() => router.push('/scan-qr')}
                        >
                            <MaterialIcons name="qr-code-scanner" size={20} color="white" />
                            <Text className="text-white font-bold text-sm ml-2">Scan QR to Start Ride</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Active ride indicator */}
                {item.status === 'active' && (
                    <View className="pt-4 mt-3 border-t border-gray-100 dark:border-gray-800">
                        <View className="py-3 rounded-lg bg-blue-50 items-center justify-center flex-row">
                            <MaterialIcons name="directions-bike" size={20} color="#2563EB" />
                            <Text className="text-blue-700 font-bold text-sm ml-2">Ride in Progress</Text>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-[#121212]">
            <View className="flex-1 px-4">
                <View className="py-4">
                    <Text className="text-2xl font-bold text-gray-900 dark:text-white">Bookings</Text>
                </View>

                <View className="flex-row gap-2 mb-4 flex-wrap">
                    {['Pending', 'Confirmed', 'Active', 'All'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setStatusFilter(tab)}
                            className={`px-4 py-2 rounded-full border ${statusFilter === tab
                                ? 'bg-gray-900 border-gray-900 dark:bg-white dark:border-white'
                                : 'bg-transparent border-gray-200 dark:border-gray-800'
                                }`}
                        >
                            <Text className={`font-medium text-sm ${statusFilter === tab
                                ? 'text-white dark:text-black'
                                : 'text-gray-500'
                                }`}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#2563EB" />
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
