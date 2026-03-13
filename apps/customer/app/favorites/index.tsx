import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getFavorites, removeFavorite } from '@/constants/ApiService';

interface FavoriteBike {
    id: number;
    bike: number;
    bike_details: {
        id: number;
        brand: string;
        model: string;
        image: string | null;
        price_per_hour: string;
        average_rating: string;
        review_count: number;
        vendor_name: string;
    };
    created_at: string;
}

export default function FavoritesScreen() {
    const [favorites, setFavorites] = useState<FavoriteBike[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchFavorites = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const data = await getFavorites();
            setFavorites(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch favorites:', error);
            setFavorites([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchFavorites();
        }, [])
    );

    const handleRemoveFavorite = async (bikeId: number) => {
        try {
            await removeFavorite(bikeId);
            setFavorites(prev => prev.filter(f => f.bike !== bikeId));
        } catch (error) {
            console.error('Failed to remove favorite:', error);
        }
    };

    const renderFavorite = ({ item, index }: { item: FavoriteBike, index: number }) => {
        const bike = item.bike_details;
        const imageUrl = bike.image || 'https://via.placeholder.com/150';

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 100).springify()}
                className="bg-surface rounded-2xl p-3 mb-4 shadow-sm border border-border"
            >
                <TouchableOpacity
                    onPress={() => router.push({ pathname: '/details', params: { id: bike.id } })}
                    className="flex-row gap-4"
                >
                    <View className="relative">
                        <Image
                            source={{ uri: imageUrl }}
                            className="h-24 w-24 rounded-xl bg-gray-200"
                            resizeMode="cover"
                        />
                        <View className="absolute top-2 left-2 bg-white/90 px-1.5 py-0.5 rounded">
                            <View className="flex-row items-center">
                                <MaterialIcons name="star" size={10} color="#F59E0B" />
                                <Text className="text-[10px] font-bold ml-0.5">{bike.average_rating}</Text>
                            </View>
                        </View>
                    </View>

                    <View className="flex-1 justify-between py-1">
                        <View>
                            <Text className="text-text-primary font-bold text-base">{bike.brand} {bike.model}</Text>
                            <Text className="text-text-secondary text-sm mt-0.5">{bike.vendor_name}</Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                            <Text className="text-primary font-bold text-lg">
                                ₹{bike.price_per_hour}
                                <Text className="text-text-secondary text-xs font-normal">/hr</Text>
                            </Text>
                            <TouchableOpacity
                                onPress={() => handleRemoveFavorite(item.bike)}
                                className="bg-red-50 p-2 rounded-full"
                            >
                                <MaterialIcons name="favorite" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center px-4 py-4 bg-surface border-b border-border">
                <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center -ml-2">
                    <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text className="flex-1 text-center text-lg font-bold text-text-primary pr-10">My Favorites</Text>
            </View>

            <View className="flex-1 px-6 pt-4">
                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#0F766E" />
                        <Text className="text-text-muted mt-2">Loading favorites...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={favorites}
                        renderItem={renderFavorite}
                        keyExtractor={item => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => { setRefreshing(true); fetchFavorites(false); }}
                                colors={['#0F766E']}
                            />
                        }
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20">
                                <MaterialIcons name="favorite-border" size={60} color="#E2E8F0" />
                                <Text className="text-text-muted font-medium text-base mt-4">No favorites yet</Text>
                                <Text className="text-text-secondary text-sm mt-2 text-center px-8">
                                    Tap the heart icon on bikes you like to add them here
                                </Text>
                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)')}
                                    className="mt-6 bg-primary px-6 py-3 rounded-full"
                                >
                                    <Text className="text-white font-bold">Browse Bikes</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
