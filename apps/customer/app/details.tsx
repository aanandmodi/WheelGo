import AnimatedButton from '@/components/ui/AnimatedButton';
import Card from '@/components/ui/Card';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { API_URL } from '@/constants/Api';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/constants/ApiService';

export default function BikeDetailsScreen() {
    const { id } = useLocalSearchParams();
    const [bike, setBike] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { location, loading: locationLoading } = useLocation();
    const { user } = useAuth();

    useEffect(() => {
        const fetchBikeDetails = async () => {
            try {
                let endpoint = `/inventory/bikes/${id}/`;
                if (!locationLoading && location) {
                    endpoint += `?lat=${location.latitude}&lng=${location.longitude}`;
                }
                const response = await authFetch(endpoint);
                const data = await response.json();
                if (response.ok) {
                    setBike(data);
                }
            } catch (error) {
                console.error("Failed to fetch bike details", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchBikeDetails();
    }, [id, locationLoading, location.latitude, location.longitude]);

    const handleBookNow = () => {
        if (!user) {
            Alert.alert("Login Required", "Please login to book a bike.");
            return;
        }
        if (!user.is_kyc_verified) {
            Alert.alert(
                "KYC Verification Required",
                "Please verify your KYC via DigiLocker / Aadhaar before booking a ride.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Verify Now", onPress: () => router.push('/kyc/instant') }
                ]
            );
            return;
        }
        router.push({ pathname: '/booking', params: { id: bike.id } });
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-surface items-center justify-center">
                <ActivityIndicator size="large" color="#008a7c" />
            </SafeAreaView>
        );
    }

    if (!bike) {
        return (
            <SafeAreaView className="flex-1 bg-surface items-center justify-center">
                <Text>Bike not found</Text>
            </SafeAreaView>
        );
    }

    const imageUrl = bike.image ? bike.image : 'https://via.placeholder.com/300';

    return (
        <>
            <Stack.Screen options={{
                title: `${bike.brand} ${bike.model}`,
                headerBackTitle: 'Back',
                headerShown: true,
                headerTintColor: '#0F172A',
                headerTitleStyle: { color: '#0F172A' },
            }} />

            <SafeAreaView className="flex-1 bg-surface" edges={['bottom', 'left', 'right']}>
                <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
                    {/* Hero Image */}
                    <View className="relative h-64 w-full bg-slate-100">
                        <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
                    </View>

                    <View className="px-6 pt-6 pb-32 bg-background rounded-t-3xl -mt-6">

                        <Animated.View entering={FadeInDown.duration(500)}>
                            <View className="flex-row justify-between items-start mb-2">
                                <View className="flex-1 mr-4">
                                    <View className="flex-row items-center mb-2 gap-2">
                                        <View className="bg-secondary/10 px-2 py-0.5 rounded mr-2">
                                            <Text className="text-secondary-dark text-[10px] font-bold uppercase">{bike.status}</Text>
                                        </View>
                                        <View className="flex-row items-center">
                                            <FontAwesome name="star" size={12} color="#F59E0B" />
                                            <Text className="ml-1 text-text-secondary font-bold text-xs">{bike.average_rating || 'New'} ({bike.review_count || 0})</Text>
                                        </View>
                                    </View>
                                    <Text className="text-2xl font-bold text-text-primary leading-tight">{bike.brand} {bike.model}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-2xl font-bold text-primary">₹{bike.price_per_hour}</Text>
                                    <Text className="text-text-muted text-xs font-medium">per hour</Text>
                                </View>
                            </View>

                            <View className="flex-row gap-4 my-6">
                                <View className="flex-1 bg-surface p-3 rounded-2xl border border-border items-center shadow-sm">
                                    <MaterialIcons name="speed" size={24} color="#0F766E" />
                                    <Text className="text-xs text-text-secondary mt-1.5 font-medium">-- km/h</Text>
                                    <Text className="text-[10px] text-text-muted">Max Speed</Text>
                                </View>
                                <View className="flex-1 bg-surface p-3 rounded-2xl border border-border items-center shadow-sm">
                                    <MaterialIcons name="local-gas-station" size={24} color="#0F766E" />
                                    <Text className="text-xs text-text-secondary mt-1.5 font-medium">-- kmpl</Text>
                                    <Text className="text-[10px] text-text-muted">Mileage</Text>
                                </View>
                                <View className="flex-1 bg-surface p-3 rounded-2xl border border-border items-center shadow-sm">
                                    <MaterialIcons name="settings" size={24} color="#0F766E" />
                                    <Text className="text-xs text-text-secondary mt-1.5 font-medium">Manual</Text>
                                    <Text className="text-[10px] text-text-muted">Gear</Text>
                                </View>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
                            <Text className="text-lg font-bold mb-3 text-text-primary">Features</Text>
                            <View className="flex-row flex-wrap mb-8 gap-2">
                                {/* Mock Features for now since backend doesn't store them yet */}
                                {['2 Helmets', 'Insurance', 'GPS'].map((feature, index) => (
                                    <View key={index} className="bg-surface border border-border px-4 py-2 rounded-full">
                                        <Text className="text-text-secondary font-medium text-xs">{feature}</Text>
                                    </View>
                                ))}
                            </View>

                            <Text className="text-lg font-bold mb-3 text-text-primary">About</Text>
                            <Text className="text-text-secondary leading-6 text-base">{bike.description || 'No description available for this vehicle.'}</Text>
                        </Animated.View>

                        {/* Pickup Location Map */}
                        {bike.vendor_latitude && bike.vendor_longitude && (
                            <Animated.View entering={FadeInDown.delay(300).duration(500)} className="mt-6">
                                <Text className="text-lg font-bold mb-3 text-text-primary">📍 Pickup Location</Text>
                                <View className="rounded-2xl overflow-hidden border border-border h-48">
                                    <MapView
                                        provider={PROVIDER_GOOGLE}
                                        style={{ flex: 1 }}
                                        initialRegion={{
                                            latitude: bike.vendor_latitude,
                                            longitude: bike.vendor_longitude,
                                            latitudeDelta: 0.005,
                                            longitudeDelta: 0.005,
                                        }}
                                        scrollEnabled={false}
                                    >
                                        <Marker
                                            coordinate={{ latitude: bike.vendor_latitude, longitude: bike.vendor_longitude }}
                                            title={bike.vendor_name}
                                            description={bike.vendor_address}
                                        />
                                    </MapView>
                                </View>
                                <Text className="text-text-secondary text-sm mt-2 ml-1">
                                    {bike.vendor_address} {bike.distance_km ? `• ${bike.distance_km} km away` : ''}
                                </Text>
                            </Animated.View>
                        )}
                    </View>
                </ScrollView>

                {/* Footer */}
                <Animated.View
                    entering={FadeInDown.delay(400)}
                    className="absolute bottom-0 left-0 right-0 p-6 bg-surface border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-3xl"
                >
                    <View className="flex-row gap-4 items-center">
                        <View className="flex-1 justify-center">
                            <Text className="text-text-muted text-xs font-medium uppercase">Price / Hour</Text>
                            <Text className="text-3xl font-bold text-text-primary">₹{bike.price_per_hour}</Text>
                        </View>
                        <View className="flex-[1.5]">
                            <AnimatedButton title="Book Now" onPress={handleBookNow} />
                        </View>
                    </View>
                </Animated.View>
            </SafeAreaView>
        </>
    );
}

