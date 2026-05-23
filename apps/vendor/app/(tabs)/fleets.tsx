import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, SafeAreaView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
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

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-white dark:bg-[#1E1E1E] rounded-xl p-3 mb-4 flex-row shadow-sm border border-gray-100 dark:border-gray-800">
            <Image
                source={{ uri: item.photo || 'https://via.placeholder.com/150' }}
                className="h-24 w-24 rounded-lg bg-gray-200"
                resizeMode="cover"
            />
            <View className="flex-1 ml-4 justify-between py-1">
                <View>
                    <View className="flex-row justify-between items-start">
                        <Text className="text-base font-bold text-gray-900 dark:text-white flex-1 mr-2">{item.brand} {item.model}</Text>
                        <View className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                    ${item.status === 'available' ? 'bg-green-100 text-green-700' :
                                item.status === 'rented' || item.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                            <Text className={
                                item.status === 'available' ? 'text-green-700' :
                                    item.status === 'rented' || item.status === 'active' ? 'text-blue-700' : 'text-red-700'
                            }>{item.status}</Text>
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
                    <Text className="text-blue-600 font-bold">₹{item.price_per_hour}/hr</Text>
                    <View className="flex-row gap-2">
                        <TouchableOpacity
                            className={`px-3 py-1 rounded ${item.status === 'available' ? 'bg-orange-100' : 'bg-green-100'}`}
                            onPress={() => handleToggleAvailability(item.id)}
                            disabled={item.status === 'rented' || item.status === 'active'}
                        >
                            <Text className={`text-[10px] font-bold ${item.status === 'available' ? 'text-orange-700' : 'text-green-700'}`}>
                                {item.status === 'available' ? 'Disable' : 'Enable'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="p-2">
                            <FontAwesome name="edit" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-[#121212]">
            <View className="flex-1 px-4">
                <View className="flex-row justify-between items-center py-4">
                    <Text className="text-2xl font-bold text-gray-900 dark:text-white">My Fleet</Text>
                    <TouchableOpacity
                        className="bg-blue-600 h-10 w-10 rounded-full items-center justify-center shadow-lg shadow-blue-500/30"
                        onPress={() => router.push('/add-vehicle')}
                    >
                        <FontAwesome name="plus" size={16} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Filter Tabs */}
                {/* Note: Backend uses lowercase 'available', 'rented', 'maintenance'. Matching tabs. */}
                <View className="flex-row gap-2 mb-4">
                    {['All', 'Available', 'Rented', 'Maintenance'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setFilter(tab)}
                            className={`px-4 py-2 rounded-full border ${filter === tab
                                ? 'bg-gray-900 border-gray-900 dark:bg-white dark:border-white'
                                : 'bg-transparent border-gray-200 dark:border-gray-800'
                                }`}
                        >
                            <Text className={`font-medium text-sm ${filter === tab
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
