import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, SafeAreaView, ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
        { label: 'Total Earnings', value: `₹${stats.total_earnings || 0}`, icon: 'rupee', isPrimary: true },
        { label: 'Active Bookings', value: `${stats.active_rentals || 0}`, icon: 'calendar-check-o', isPrimary: false },
        { label: 'Total Vehicles', value: `${stats.total_bikes || 0}`, icon: 'bicycle', isPrimary: false },
    ];

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="flex-row justify-between items-center mb-6">
                    <TouchableOpacity 
                        className="flex-row items-center gap-3 flex-1 mr-4"
                        onPress={() => router.push('/shop-location')}
                        activeOpacity={0.7}
                    >
                        <View className="h-10 w-10 bg-yellow-50 rounded-full items-center justify-center">
                            <FontAwesome name="map-marker" size={18} color="#FFC72C" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Shop Location</Text>
                            <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
                                {profile ? profile.shop_name : 'Loading Shop...'}
                            </Text>
                            {profile && (
                                <Text className="text-gray-400 text-xs" numberOfLines={1}>
                                    {profile.address || 'Set shop address'}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity className="h-10 w-10 bg-white items-center justify-center rounded-full border border-border shadow-sm">
                        <FontAwesome name="bell-o" size={18} color="#0F1115" />
                        <View className="absolute top-2.5 right-2.5 h-2 w-2 bg-yellow-500 rounded-full" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#0F1115" className="mt-10" />
                ) : (
                    <>
                        {/* Stats Cards */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8" contentContainerStyle={{ paddingLeft: 2 }}>
                            {STATS.map((stat, index) => (
                                <Animated.View 
                                    key={index} 
                                    entering={FadeInDown.duration(600).delay(index * 100).springify()}
                                    className={`p-4 rounded-3xl mr-4 w-40 border ${
                                        stat.isPrimary ? 'bg-primary border-primary' : 'bg-white border-border shadow-sm'
                                    }`}
                                >
                                    <View className={`h-9 w-9 rounded-full items-center justify-center mb-3 ${
                                        stat.isPrimary ? 'bg-secondary' : 'bg-gray-150'
                                    }`}>
                                        <FontAwesome 
                                            name={stat.icon as any} 
                                            size={16} 
                                            color={stat.isPrimary ? '#0F1115' : '#FFC72C'} 
                                        />
                                    </View>
                                    <Text className={`text-[10px] font-bold uppercase tracking-wider ${
                                        stat.isPrimary ? 'text-gray-400' : 'text-gray-505'
                                    }`}>{stat.label}</Text>
                                    <Text className={`text-xl font-bold mt-1 ${
                                        stat.isPrimary ? 'text-white' : 'text-primary'
                                    }`}>{stat.value}</Text>
                                </Animated.View>
                            ))}
                        </ScrollView>

                        {/* Quick Actions */}
                        <View className="flex-row gap-4 mb-8">
                            <TouchableOpacity
                                className="flex-1 bg-primary p-4 rounded-full flex-row items-center justify-center shadow-lg shadow-gray-950/15"
                                onPress={() => router.push('/(tabs)/fleets')}
                            >
                                <FontAwesome name="plus" size={14} color="white" className="mr-2" />
                                <Text className="text-white font-bold ml-2">Add Vehicle</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 bg-white p-4 rounded-full flex-row items-center justify-center border border-border shadow-sm"
                                onPress={() => router.push('/(tabs)/bookings')}
                            >
                                <Text className="text-primary font-bold">View Requests</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Recent Activity */}
                        <View className="mb-4">
                            <Text className="text-lg font-bold text-gray-900 mb-4">Recent Activity</Text>

                            {stats.recent_activity.length === 0 ? (
                                <Text className="text-gray-400 text-center italic mt-2">No recent activity</Text>
                            ) : (
                                stats.recent_activity.map((item: any) => (
                                    <View key={item.id} className="bg-white p-4 rounded-2xl mb-3 flex-row items-center border border-border shadow-sm">
                                        <View className={`h-10 w-10 rounded-full items-center justify-center mr-4 ${item.type === 'request' ? 'bg-yellow-50' :
                                            item.type === 'return' ? 'bg-gray-100' : 'bg-green-50'
                                            }`}>
                                            <FontAwesome name={
                                                item.type === 'request' ? 'inbox' :
                                                    item.type === 'return' ? 'undo' : 'money'
                                            } size={16} color={
                                                item.type === 'request' ? '#FFC72C' :
                                                    item.type === 'return' ? '#0F1115' : '#10B981'
                                            } />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-900 font-bold text-sm">{item.title}</Text>
                                            <Text className="text-gray-500 text-xs mt-0.5">{item.desc}</Text>
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
