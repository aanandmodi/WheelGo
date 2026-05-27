import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, SafeAreaView, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import { VendorApiService } from '@/constants/ApiService';

interface Earning {
    id: number;
    booking_id: number;
    bike_name: string;
    customer_phone: string;
    gross_amount: string;
    platform_fee: string;
    net_amount: string;
    status: string;
    created_at: string;
}

interface Summary {
    total_earnings: number;
    platform_fees: number;
    available_balance: number;
    paid_out: number;
    earnings_count: number;
}

export default function EarningsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [earnings, setEarnings] = useState<Earning[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            // Fetch summary
            const summaryData = await VendorApiService.getEarningsSummary();
            setSummary(summaryData);

            // Fetch earnings list
            const listData = await VendorApiService.getEarnings();
            setEarnings(Array.isArray(listData) ? listData : []);
        } catch (error) {
            console.error('Failed to fetch earnings', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (token) fetchData();
        }, [token])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const renderEarningItem = ({ item }: { item: Earning }) => (
        <Animated.View 
            entering={FadeInDown.duration(400).springify()}
            className="bg-white rounded-2xl p-4 mb-3 border border-border shadow-sm"
        >
            <View className="flex-row justify-between items-start">
                <View className="flex-1">
                    <Text className="text-gray-900 font-bold">{item.bike_name}</Text>
                    <Text className="text-gray-500 text-xs mt-1">Booking #{item.booking_id}</Text>
                    <Text className="text-gray-400 text-xs">{item.customer_phone}</Text>
                </View>
                <View className="items-end">
                    <Text className="text-green-600 font-bold text-lg">+₹{item.net_amount}</Text>
                    <View className={`px-2 py-0.5 rounded mt-1 ${item.status === 'pending' ? 'bg-orange-100' : 'bg-green-150'}`}>
                        <Text className={`text-[10px] font-bold uppercase ${item.status === 'pending' ? 'text-orange-700' : 'text-green-700'}`}>
                            {item.status}
                        </Text>
                    </View>
                </View>
            </View>
            <View className="flex-row justify-between mt-3 pt-3 border-t border-gray-150">
                <Text className="text-gray-400 text-xs">Gross: ₹{item.gross_amount}</Text>
                <Text className="text-gray-400 text-xs">Fee: -₹{item.platform_fee}</Text>
                <Text className="text-gray-400 text-xs">{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
        </Animated.View>
    );

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex-1 px-4">
                {/* Header */}
                <View className="flex-row justify-between items-center py-4">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => router.back()} className="mr-3">
                            <FontAwesome name="arrow-left" size={20} color="#6B7280" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-gray-900">Earnings</Text>
                    </View>
                    <TouchableOpacity
                        className="bg-primary px-4 py-2 rounded-full shadow-sm"
                        onPress={() => router.push('/payouts' as any)}
                    >
                        <Text className="text-white font-bold text-xs uppercase tracking-wider">Withdraw</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#0F1115" className="mt-10" />
                ) : (
                    <>
                        {/* Summary Cards */}
                        {summary && (
                            <View className="flex-row gap-3 mb-6">
                                <View className="flex-1 bg-primary p-4 rounded-3xl border border-primary shadow-sm">
                                    <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Available Balance</Text>
                                    <Text className="text-secondary text-2xl font-bold mt-1">₹{summary.available_balance}</Text>
                                </View>
                                <View className="flex-1 bg-white p-4 rounded-3xl border border-border shadow-sm">
                                    <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Total Earned</Text>
                                    <Text className="text-primary text-2xl font-bold mt-1">₹{summary.total_earnings}</Text>
                                </View>
                            </View>
                        )}

                        {/* Stats Row */}
                        {summary && (
                            <View className="flex-row justify-between bg-white p-4 rounded-2xl mb-4 border border-border shadow-sm">
                                <View className="items-center">
                                    <Text className="text-gray-400 text-xs">Paid Out</Text>
                                    <Text className="text-gray-900 font-bold">₹{summary.paid_out}</Text>
                                </View>
                                <View className="items-center">
                                    <Text className="text-gray-400 text-xs">Platform Fees</Text>
                                    <Text className="text-red-500 font-bold">₹{summary.platform_fees}</Text>
                                </View>
                                <View className="items-center">
                                    <Text className="text-gray-400 text-xs">Rides</Text>
                                    <Text className="text-gray-900 font-bold">{summary.earnings_count}</Text>
                                </View>
                            </View>
                        )}

                        {/* Earnings List */}
                        <Text className="text-lg font-bold text-gray-900 mb-3">Transaction History</Text>
                        <FlatList
                            data={earnings}
                            renderItem={renderEarningItem}
                            keyExtractor={(item) => item.id.toString()}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F1115']} />
                            }
                            ListEmptyComponent={
                                <View className="items-center justify-center py-20">
                                    <FontAwesome name="money" size={40} color="#D1D5DB" />
                                    <Text className="text-gray-400 mt-4">No earnings yet</Text>
                                    <Text className="text-gray-400 text-xs mt-1">Complete rides to earn!</Text>
                                </View>
                            }
                        />
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}
