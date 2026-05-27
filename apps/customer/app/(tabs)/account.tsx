import Card from '@/components/ui/Card';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCustomerProfile } from '@/constants/ApiService';
import { useAuth } from '@/context/AuthContext';

interface Profile {
    id: number;
    phone_number: string;
    full_name: string;
    email: string;
    avatar: string | null;
    is_kyc_verified: boolean;
}

export default function AccountScreen() {
    const { logout, isLoggedIn } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProfile = async (showLoading = true) => {
        if (!isLoggedIn) return;
        try {
            if (showLoading) setLoading(true);
            const data = await getCustomerProfile();
            setProfile(data);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (isLoggedIn) {
                fetchProfile();
            }
        }, [isLoggedIn])
    );

    const handleLogout = async () => {
        await logout();
        router.replace('/auth/login');
    };

    const MENU_ITEMS = [
        {
            icon: 'user-o',
            title: 'Edit Profile',
            subtitle: '',
            action: () => router.push({ pathname: '/kyc/instant', params: { edit: 'true' } })
        },
        {
            icon: 'id-card-o',
            title: 'KYC Verification',
            subtitle: profile?.is_kyc_verified ? 'Verified' : 'Not Verified',
            subtitleColor: profile?.is_kyc_verified ? 'text-green-500' : 'text-red-500',
            action: () => router.push('/kyc/instant')
        },
        {
            icon: 'bell-o',
            title: 'Notifications',
            subtitle: '',
            action: () => router.push('/notifications')
        },
        {
            icon: 'heart-o',
            title: 'Favorites',
            subtitle: '',
            action: () => router.push('/favorites')
        },
        {
            icon: 'question-circle-o',
            title: 'Help & Support',
            subtitle: '',
            action: () => router.push('/ride/feedback')
        },
        {
            icon: 'file-text-o',
            title: 'Terms & Conditions',
            subtitle: '',
            action: () => router.push('/terms')
        },
        {
            icon: 'sign-out',
            title: 'Logout',
            subtitle: '',
            action: handleLogout
        },
    ];

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#0F766E" />
                <Text className="text-text-muted mt-2">Loading profile...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView
                className="flex-1 p-6"
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchProfile(false); }}
                        colors={['#0F766E']}
                    />
                }
            >
                <Text className="text-2xl font-bold mb-6 mt-4 text-text-primary">Profile</Text>

                <View className="items-center mb-8">
                    <View className="w-24 h-24 bg-surface rounded-full mb-4 overflow-hidden border-2 border-primary shadow-sm">
                        <Image
                            source={{ uri: profile?.avatar || 'https://via.placeholder.com/150' }}
                            className="w-full h-full"
                        />
                    </View>
                    <Text className="text-xl font-bold text-text-primary">
                        {profile?.full_name || 'Set up your profile'}
                    </Text>
                    <Text className="text-text-secondary">{profile?.phone_number || 'Phone not set'}</Text>
                    {profile?.email && (
                        <Text className="text-text-secondary text-sm mt-1">{profile.email}</Text>
                    )}
                </View>

                {MENU_ITEMS.map((item, index) => (
                    <TouchableOpacity key={index} onPress={item.action}>
                        <Card className="mb-3 flex-row items-center p-4 bg-surface border border-border">
                            <View className="w-10 h-10 bg-primary/10 rounded-full justify-center items-center mr-4">
                                <FontAwesome name={item.icon as any} size={18} color="#0F766E" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-semibold text-text-primary">{item.title}</Text>
                                {item.subtitle ? (
                                    <Text className={`text-xs mt-0.5 ${item.subtitleColor || 'text-text-secondary'}`}>
                                        {item.subtitle}
                                    </Text>
                                ) : null}
                            </View>
                            <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
                        </Card>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}
