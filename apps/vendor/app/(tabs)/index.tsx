import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, SafeAreaView, ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { VendorApiService } from '@/constants/ApiService';

export default function DashboardScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total_earnings: 0,
        active_rentals: 0,
        total_bikes: 0,
        recent_activity: []
    });

    const [profile, setProfile] = useState<any>(null);

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                try {
                    const [statsData, profileData] = await Promise.all([
                        VendorApiService.getDashboardStats(),
                        VendorApiService.getProfile().catch(err => {
                            console.warn("Failed to load profile, showing default", err);
                            return null;
                        })
                    ]);
                    setStats(statsData);
                    if (profileData) setProfile(profileData);
                } catch (error) {
                    console.error("Failed to fetch dashboard data", error);
                } finally {
                    setLoading(false);
                }
            };

            if (token) fetchData();
        }, [token])
    );

    const STATS = [
        { label: 'Total Earnings', value: `₹${stats.total_earnings || 0}`, icon: 'rupee', color: 'bg-green-500' },
        { label: 'Active Bookings', value: `${stats.active_rentals || 0}`, icon: 'calendar-check-o', color: 'bg-blue-500' },
        { label: 'Total Vehicles', value: `${stats.total_bikes || 0}`, icon: 'bicycle', color: 'bg-orange-500' },
    ];

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-[#121212]">
            <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <TouchableOpacity 
                        className="flex-row items-center gap-3 flex-1 mr-4"
                        onPress={() => router.push('/shop-location')}
                        activeOpacity={0.7}
                    >
                        <View className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-full items-center justify-center">
                            <FontAwesome name="map-marker" size={20} color="#2563EB" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Shop Location</Text>
                            <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                                {profile ? profile.shop_name : 'Loading Shop...'}
                            </Text>
                            {profile && (
                                <Text className="text-gray-400 text-xs" numberOfLines={1}>
                                    {profile.address || 'Set shop address'}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity className="h-10 w-10 bg-white dark:bg-[#1E1E1E] items-center justify-center rounded-full shadow-sm">
                        <FontAwesome name="bell-o" size={20} color="#6B7280" />
                        <View className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#2563EB" className="mt-10" />
                ) : (
                    <>
                        {/* Stats Cards */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
                            {STATS.map((stat, index) => (
                                <View key={index} className="bg-white dark:bg-[#1E1E1E] p-4 rounded-2xl mr-4 w-40 shadow-sm border border-gray-100 dark:border-gray-800">
                                    <View className={`h-10 w-10 ${stat.color} rounded-full items-center justify-center mb-3 opacity-90`}>
                                        <FontAwesome name={stat.icon as any} size={20} color="white" />
                                    </View>
                                    <Text className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">{stat.label}</Text>
                                    <Text className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</Text>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Quick Actions */}
                        <View className="flex-row gap-4 mb-8">
                            <TouchableOpacity
                                className="flex-1 bg-blue-600 p-4 rounded-xl flex-row items-center justify-center shadow-lg shadow-blue-500/20"
                                onPress={() => router.push('/(tabs)/fleets')}
                            >
                                <FontAwesome name="plus" size={16} color="white" className="mr-2" />
                                <Text className="text-white font-bold ml-2">Add Vehicle</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 bg-white dark:bg-[#1E1E1E] p-4 rounded-xl flex-row items-center justify-center border border-gray-200 dark:border-gray-700"
                                onPress={() => router.push('/(tabs)/bookings')}
                            >
                                <Text className="text-gray-900 dark:text-white font-bold">View Requests</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Recent Activity */}
                        <View className="mb-4">
                            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Activity</Text>

                            {stats.recent_activity.length === 0 ? (
                                <Text className="text-gray-400 text-center italic mt-2">No recent activity</Text>
                            ) : (
                                stats.recent_activity.map((item: any) => (
                                    <View key={item.id} className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl mb-3 flex-row items-center border border-gray-100 dark:border-gray-800">
                                        <View className={`h-10 w-10 rounded-full items-center justify-center mr-4 ${item.type === 'request' ? 'bg-orange-100' :
                                            item.type === 'return' ? 'bg-blue-100' : 'bg-green-100'
                                            }`}>
                                            <FontAwesome name={
                                                item.type === 'request' ? 'inbox' :
                                                    item.type === 'return' ? 'undo' : 'money'
                                            } size={16} color={
                                                item.type === 'request' ? '#EA580C' :
                                                    item.type === 'return' ? '#2563EB' : '#16A34A'
                                            } />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-900 dark:text-white font-bold text-sm">{item.title}</Text>
                                            <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{item.desc}</Text>
                                        </View>
                                        <Text className="text-gray-400 text-xs">{item.time}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}
