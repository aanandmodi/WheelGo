import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getBookings, getAccessToken } from '@/constants/ApiService';

type BookingTab = 'Upcoming' | 'Past';

interface Booking {
    id: number;
    bike_brand: string;
    bike_model: string;
    bike_image: string | null;
    vendor_name: string;
    start_time: string;
    end_time: string;
    total_amount: string;
    status: string;
    payment_status: string;
    created_at: string;
}

export default function HistoryScreen() {
    const [activeTab, setActiveTab] = useState<BookingTab>('Upcoming');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(true);

    const fetchBookings = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);

            // Check if user is logged in
            const token = await getAccessToken();
            if (!token) {
                setIsLoggedIn(false);
                setBookings([]);
                return;
            }
            setIsLoggedIn(true);

            const filter = activeTab === 'Upcoming' ? 'upcoming' : 'past';
            const data = await getBookings(filter);
            setBookings(Array.isArray(data) ? data : data.results || []);
        } catch (error: any) {
            console.error('Failed to fetch bookings:', error);
            // If auth error, show login prompt instead of error
            if (error.message?.includes('401') || error.message?.includes('authentication')) {
                setIsLoggedIn(false);
            }
            setBookings([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchBookings();
        }, [activeTab])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings(false);
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('en-IN', options);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return { bg: 'bg-green-100', text: 'text-green-700' };
            case 'pending': return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
            case 'active': return { bg: 'bg-blue-100', text: 'text-blue-700' };
            case 'completed': return { bg: 'bg-gray-100', text: 'text-gray-600' };
            case 'cancelled': return { bg: 'bg-red-100', text: 'text-red-700' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-600' };
        }
    };

    const renderTrip = ({ item, index }: { item: Booking, index: number }) => {
        const statusColors = getStatusColor(item.status);
        const imageUrl = item.bike_image || 'https://via.placeholder.com/150';

        return (
            <Animated.View entering={FadeInDown.delay(index * 100).springify()} className="bg-surface rounded-2xl p-4 mb-4 shadow-sm border border-border">
                <View className="flex-row gap-4 mb-3">
                    <Image
                        source={{ uri: imageUrl }}
                        className="h-20 w-20 rounded-xl bg-gray-200"
                        resizeMode="cover"
                    />
                    <View className="flex-1">
                        <View className="flex-row justify-between items-start">
                            <Text className="text-text-primary font-bold text-base flex-1 mr-2">
                                {item.bike_brand} {item.bike_model}
                            </Text>
                            <View className={`px-2 py-0.5 rounded ${statusColors.bg}`}>
                                <Text className={`${statusColors.text} font-bold text-[10px] uppercase`}>
                                    {item.status}
                                </Text>
                            </View>
                        </View>
                        <Text className="text-text-secondary text-sm mt-1">
                            {formatDateTime(item.start_time)}
                        </Text>

                        {activeTab === 'Upcoming' && (
                            <View className="flex-row items-center mt-2">
                                <MaterialIcons name="store" size={14} color="#0F766E" />
                                <Text className="text-text-secondary text-xs ml-1 flex-1" numberOfLines={1}>
                                    {item.vendor_name}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <View className="flex-row justify-between items-center pt-3 border-t border-border">
                    <Text className="text-text-primary font-bold text-base">₹{item.total_amount}</Text>
                    <TouchableOpacity onPress={() => router.push({ pathname: '/ride/summary', params: { id: item.id } })}>
                        <Text className="text-primary font-bold text-sm">View Details</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex-1 px-6 pt-4">
                <Text className="text-2xl font-bold text-text-primary mb-6">My Trips</Text>

                <View className="flex-row gap-4 mb-6">
                    <TouchableOpacity
                        onPress={() => setActiveTab('Upcoming')}
                        className={`flex-1 py-3 rounded-2xl items-center ${activeTab === 'Upcoming' ? 'bg-primary' : 'bg-surface border border-border'}`}
                    >
                        <Text className={`font-bold ${activeTab === 'Upcoming' ? 'text-white' : 'text-text-secondary'}`}>Upcoming</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('Past')}
                        className={`flex-1 py-3 rounded-2xl items-center ${activeTab === 'Past' ? 'bg-primary' : 'bg-surface border border-border'}`}
                    >
                        <Text className={`font-bold ${activeTab === 'Past' ? 'text-white' : 'text-text-secondary'}`}>History</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#0F766E" />
                        <Text className="text-text-muted mt-2">Loading trips...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={bookings}
                        renderItem={renderTrip}
                        keyExtractor={item => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F766E']} />
                        }
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20">
                                <MaterialIcons
                                    name={isLoggedIn ? "two-wheeler" : "login"}
                                    size={60}
                                    color="#E2E8F0"
                                />
                                <Text className="text-text-muted font-medium text-base mt-4">
                                    {isLoggedIn ? `No ${activeTab.toLowerCase()} trips found` : 'Please log in to see your trips'}
                                </Text>
                                {!isLoggedIn ? (
                                    <TouchableOpacity
                                        onPress={() => router.replace('/auth/login')}
                                        className="mt-6 bg-primary px-6 py-3 rounded-full"
                                    >
                                        <Text className="text-white font-bold">Log In</Text>
                                    </TouchableOpacity>
                                ) : activeTab === 'Upcoming' && (
                                    <TouchableOpacity onPress={() => router.push('/(tabs)')} className="mt-6 bg-primary px-6 py-3 rounded-full">
                                        <Text className="text-white font-bold">Book a Ride</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
