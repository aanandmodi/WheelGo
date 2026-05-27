import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, SafeAreaView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import { VendorApiService } from '@/constants/ApiService';

export default function FleetScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [filter, setFilter] = useState('All');
    const [bikes, setBikes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const fetchBikes = async () => {
                try {
                    const data = await VendorApiService.getFleet();
                    setBikes(Array.isArray(data) ? data : []);
                } catch (error) {
                    console.error('Failed to fetch bikes', error);
                    setBikes([]);
                } finally {
                    setLoading(false);
                }
            };

            if (token) fetchBikes();
        }, [token])
    );

    const filteredBikes = filter === 'All' ? bikes : bikes.filter((b: any) => b.status.toLowerCase() === filter.toLowerCase());

    const handleToggleAvailability = async (bikeId: number) => {
        try {
            const data = await VendorApiService.toggleBikeAvailability(bikeId.toString());
            // Update local state
            setBikes(prev => prev.map((b: any) =>
                b.id === bikeId ? { ...b, status: data.status } : b
            ));
        } catch (error: any) {
            console.error('Toggle failed', error);
            alert(error.message || 'Failed to toggle availability');
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const getStatusBadgeStyle = (status: string) => {
            const lower = status.toLowerCase();
            if (lower === 'available') return 'bg-green-50 text-green-700';
            if (lower === 'rented' || lower === 'active') return 'bg-yellow-50 text-yellow-800';
            return 'bg-gray-100 text-gray-500';
        };

        return (
            <Animated.View 
                entering={FadeInDown.duration(400).springify()}
                className="bg-white rounded-2xl p-3 mb-4 flex-row shadow-sm border border-border"
            >
                <Image
                    source={{ uri: item.image || 'https://via.placeholder.com/150' }}
                    className="h-24 w-24 rounded-xl bg-gray-100"
                    resizeMode="cover"
                />
                <View className="flex-1 ml-4 justify-between py-1">
                    <View>
                        <View className="flex-row justify-between items-start">
                            <Text className="text-base font-bold text-gray-900 flex-1 mr-2" numberOfLines={1}>{item.brand} {item.model}</Text>
                            <View className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBadgeStyle(item.status)}`}>
                                <Text className="font-bold text-[9px]">{item.status}</Text>
                            </View>
                        </View>
                        <Text className="text-gray-500 text-xs mt-1">Reg: {item.number_plate}</Text>
                        {item.vendor_address && (
                            <View className="flex-row items-center mt-1">
                                <FontAwesome name="map-marker" size={10} color="#9CA3AF" />
                                <Text className="text-gray-400 text-[10px] ml-1 flex-1" numberOfLines={1}>
                                    {item.vendor_address}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View className="flex-row justify-between items-end">
                        <Text className="text-primary font-bold">₹{item.price_per_hour}/hr</Text>
                        <View className="flex-row gap-2 items-center">
                            <TouchableOpacity
                                className={`px-3 py-1.5 rounded-full ${item.status === 'available' ? 'bg-gray-100' : 'bg-primary'}`}
                                onPress={() => handleToggleAvailability(item.id)}
                                disabled={item.status === 'rented' || item.status === 'active'}
                            >
                                <Text className={`text-[9px] font-bold ${item.status === 'available' ? 'text-gray-600' : 'text-white'}`}>
                                    {item.status === 'available' ? 'Disable' : 'Enable'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="p-2">
                                <FontAwesome name="edit" size={16} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex-1 px-4">
                <View className="flex-row justify-between items-center py-4">
                    <Text className="text-2xl font-bold text-[#0F1115]">My Fleet</Text>
                    <TouchableOpacity
                        className="bg-primary h-10 w-10 rounded-full items-center justify-center shadow-lg shadow-gray-950/15"
                        onPress={() => router.push('/add-vehicle')}
                    >
                        <FontAwesome name="plus" size={14} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Filter Tabs */}
                <View className="flex-row gap-2 mb-4">
                    {['All', 'Available', 'Rented', 'Maintenance'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setFilter(tab)}
                            className={`px-4 py-2 rounded-full border ${filter === tab
                                ? 'bg-primary border-primary'
                                : 'bg-transparent border-gray-200'
                                }`}
                        >
                            <Text className={`font-semibold text-sm ${filter === tab
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
                        data={filteredBikes}
                        renderItem={renderItem}
                        keyExtractor={(item: any) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20">
                                <Text className="text-gray-400">No vehicles found. Add one!</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
