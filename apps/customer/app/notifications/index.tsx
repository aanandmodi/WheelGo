import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { FlatList, SafeAreaView, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from 'react-native';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/constants/ApiService';

interface Notification {
    id: number;
    notification_type: string;
    title: string;
    message: string;
    data: any;
    is_read: boolean;
    created_at: string;
}

const NOTIFICATION_ICONS: Record<string, { icon: keyof typeof MaterialIcons.glyphMap; color: string; bgColor: string }> = {
    booking_confirmed: { icon: 'check-circle', color: '#16a34a', bgColor: 'bg-green-100' },
    booking_rejected: { icon: 'cancel', color: '#dc2626', bgColor: 'bg-red-100' },
    ride_started: { icon: 'play-circle-filled', color: '#2563eb', bgColor: 'bg-blue-100' },
    ride_completed: { icon: 'flag', color: '#0f766e', bgColor: 'bg-teal-100' },
    payment_success: { icon: 'payments', color: '#16a34a', bgColor: 'bg-green-100' },
    payment_failed: { icon: 'error', color: '#dc2626', bgColor: 'bg-red-100' },
    promo: { icon: 'local-offer', color: '#ea580c', bgColor: 'bg-orange-100' },
};

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('All');

    const fetchNotifications = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const data = await getNotifications();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            setNotifications([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchNotifications();
        }, [])
    );

    const handleMarkRead = async (id: number) => {
        try {
            await markNotificationRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Bookings') return n.notification_type.includes('booking') || n.notification_type.includes('ride');
        if (activeTab === 'Offers') return n.notification_type === 'promo';
        return true;
    });

    const handleNotificationPress = (item: Notification) => {
        if (!item.is_read) {
            handleMarkRead(item.id);
        }
        // Navigate based on notification type
        if (item.data?.booking_id) {
            router.push({ pathname: '/ride/summary', params: { id: item.data.booking_id } });
        }
    };

    const renderItem = ({ item }: { item: Notification }) => {
        const iconConfig = NOTIFICATION_ICONS[item.notification_type] ||
            { icon: 'info' as keyof typeof MaterialIcons.glyphMap, color: '#2563eb', bgColor: 'bg-blue-100' };

        return (
            <TouchableOpacity
                onPress={() => handleNotificationPress(item)}
                className={`flex-row p-4 border-b border-gray-100 ${item.is_read ? 'bg-white' : 'bg-blue-50'}`}
            >
                <View className={`h-10 w-10 rounded-full items-center justify-center mr-3 ${iconConfig.bgColor}`}>
                    <MaterialIcons name={iconConfig.icon} size={20} color={iconConfig.color} />
                </View>
                <View className="flex-1">
                    <View className="flex-row justify-between mb-1">
                        <Text className="text-[#111817] font-bold text-sm flex-1 mr-2">{item.title}</Text>
                        <Text className="text-gray-400 text-xs">{formatTime(item.created_at)}</Text>
                    </View>
                    <Text className="text-gray-600 text-sm leading-tight">{item.message}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1">
                {/* Header */}
                <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
                    <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center -ml-2">
                        <MaterialIcons name="arrow-back" size={24} color="#111817" />
                    </TouchableOpacity>
                    <Text className="flex-1 text-center text-lg font-bold text-[#111817]">Notifications</Text>
                    <TouchableOpacity onPress={handleMarkAllRead} className="h-10 items-center justify-center px-2">
                        <Text className="text-primary text-sm font-medium">Mark all read</Text>
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View className="flex-row px-4 py-3 gap-2">
                    {['All', 'Bookings', 'Offers'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-full border ${activeTab === tab ? 'bg-[#111817] border-[#111817]' : 'bg-white border-gray-200'}`}
                        >
                            <Text className={`text-sm font-medium ${activeTab === tab ? 'text-white' : 'text-gray-600'}`}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#0F766E" />
                        <Text className="text-gray-500 mt-2">Loading notifications...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredNotifications}
                        renderItem={renderItem}
                        keyExtractor={item => item.id.toString()}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => { setRefreshing(true); fetchNotifications(false); }}
                                colors={['#0F766E']}
                            />
                        }
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20">
                                <MaterialIcons name="notifications-none" size={60} color="#E2E8F0" />
                                <Text className="text-gray-500 mt-4">No notifications yet</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
