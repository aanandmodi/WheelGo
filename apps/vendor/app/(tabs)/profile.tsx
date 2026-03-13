import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, SafeAreaView, ScrollView, Switch, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/constants/Api';

const MENU_ITEMS = [
    { icon: 'bell-o', label: 'Notifications', type: 'toggle', value: true },
    { icon: 'money', label: 'Earnings', type: 'link', route: '/earnings' },
    { icon: 'bank', label: 'Bank Details', type: 'link', route: '/bank-details' },
    { icon: 'file-text-o', label: 'Terms & Conditions', type: 'link' },
    { icon: 'support', label: 'Help & Support', type: 'link' },
    { icon: 'sign-out', label: 'Logout', type: 'button', color: 'text-red-500' },
];

export default function ProfileScreen() {
    const router = useRouter();
    const { token, logout } = useAuth();
    const [profile, setProfile] = useState<any>(null);

    useFocusEffect(
        useCallback(() => {
            const fetchProfile = async () => {
                try {
                    const response = await fetch(`${API_URL}/vendors/profile/`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (response.ok) {
                        setProfile(data);
                    }
                } catch (error) {
                    console.error("Failed to fetch profile", error);
                }
            };

            if (token) fetchProfile();
        }, [token])
    );

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    await logout();
                }
            }
        ]);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-[#121212]">
            <ScrollView className="flex-1 px-4 pt-4">

                {/* Profile Card */}
                <View className="bg-white dark:bg-[#1E1E1E] p-6 rounded-2xl items-center mb-6 shadow-sm border border-gray-100 dark:border-gray-800">
                    <View className="h-24 w-24 bg-blue-100 dark:bg-blue-900/20 rounded-full items-center justify-center mb-4">
                        <Text className="text-3xl font-bold text-blue-600">
                            {profile ? profile.shop_name.charAt(0).toUpperCase() : 'V'}
                        </Text>
                    </View>
                    <Text className="text-xl font-bold text-gray-900 dark:text-white">
                        {profile ? profile.shop_name : 'Loading...'}
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Phone: {profile ? profile.phone_number : '...'}
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                        {profile ? profile.address : ''}
                    </Text>
                    <View className="flex-row items-center mt-3 bg-yellow-100 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
                        <FontAwesome name="star" size={14} color="#EAB308" />
                        <Text className="ml-1 font-bold text-yellow-700 dark:text-yellow-500">
                            {profile && profile.is_verified ? "Verified Vendor" : "Pending Verification"}
                        </Text>
                    </View>
                </View>

                {/* Menu Items */}
                <View className="bg-white dark:bg-[#1E1E1E] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 mb-8">
                    {MENU_ITEMS.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            className={`flex-row items-center p-4 border-b border-gray-100 dark:border-gray-800 ${index === MENU_ITEMS.length - 1 ? 'border-b-0' : ''}`}
                            onPress={() => {
                                if (item.label === 'Logout') handleLogout();
                                else if (item.route) router.push(item.route as any);
                            }}
                        >
                            <View className="w-10 items-center">
                                <FontAwesome name={item.icon as any} size={20} color={item.label === 'Logout' ? '#EF4444' : '#6B7280'} />
                            </View>
                            <Text className={`flex-1 font-medium ${item.color || 'text-gray-900 dark:text-white'}`}>{item.label}</Text>
                            {item.type === 'toggle' ? (
                                <Switch
                                    value={item.value}
                                    trackColor={{ false: "#767577", true: "#2563EB" }}
                                    thumbColor={"#f4f3f4"}
                                />
                            ) : (
                                <FontAwesome name="angle-right" size={20} color="#D1D5DB" />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <Text className="text-center text-gray-400 text-xs mb-8">Version 1.0.0</Text>

            </ScrollView>
        </SafeAreaView>
    );
}
