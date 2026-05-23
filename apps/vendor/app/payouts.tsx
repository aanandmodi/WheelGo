import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, SafeAreaView, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { VendorApiService } from '@/constants/ApiService';

interface Payout {
    id: number;
    amount: string;
    utr: string;
    status: string;
    created_at: string;
    processed_at: string | null;
}

export default function PayoutsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [amount, setAmount] = useState('');
    const [availableBalance, setAvailableBalance] = useState(0);

    const fetchData = async () => {
        try {
            // Fetch available balance
            const summaryData = await VendorApiService.getEarningsSummary();
            setAvailableBalance(summaryData.available_balance || 0);

            // Fetch payouts list
            const listData = await VendorApiService.getPayouts();
            setPayouts(Array.isArray(listData) ? listData : []);
        } catch (error) {
            console.error('Failed to fetch payouts', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (token) fetchData();
        }, [token])
    );

    const handleRequestPayout = async () => {
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum < 100) {
            Alert.alert('Invalid Amount', 'Minimum payout amount is ₹100');
            return;
        }
        if (amountNum > availableBalance) {
            Alert.alert('Insufficient Balance', `Available balance: ₹${availableBalance}`);
            return;
        }

        setRequesting(true);
        try {
            const data = await VendorApiService.requestPayout(amountNum);
            Alert.alert('Success', data.message || 'Payout requested!');
            setAmount('');
            fetchData(); // Refresh
        } catch (error: any) {
            console.error('Failed to request payout', error);
            Alert.alert('Error', error.message || 'Failed to request payout');
        } finally {
            setRequesting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return { bg: 'bg-green-100', text: 'text-green-700' };
            case 'processing': return { bg: 'bg-blue-100', text: 'text-blue-700' };
            case 'failed': return { bg: 'bg-red-100', text: 'text-red-700' };
            default: return { bg: 'bg-orange-100', text: 'text-orange-700' };
        }
    };

    const renderPayoutItem = ({ item }: { item: Payout }) => {
        const colors = getStatusColor(item.status);
        return (
            <View className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4 mb-3 border border-gray-100 dark:border-gray-800">
                <View className="flex-row justify-between items-start">
                    <View>
                        <Text className="text-gray-900 dark:text-white font-bold text-lg">₹{item.amount}</Text>
                        <Text className="text-gray-400 text-xs mt-1">
                            {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                    <View className={`px-2 py-1 rounded ${colors.bg}`}>
                        <Text className={`text-xs font-bold uppercase ${colors.text}`}>{item.status}</Text>
                    </View>
                </View>
                {item.utr && (
                    <Text className="text-gray-400 text-xs mt-2">UTR: {item.utr}</Text>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-[#121212]">
            <View className="flex-1 px-4">
                {/* Header */}
                <View className="flex-row items-center py-4">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <FontAwesome name="arrow-left" size={20} color="#6B7280" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-gray-900 dark:text-white">Payouts</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#2563EB" className="mt-10" />
                ) : (
                    <>
                        {/* Request Payout Card */}
                        <View className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-800">
                            <Text className="text-gray-500 text-xs font-medium uppercase mb-1">Available Balance</Text>
                            <Text className="text-green-600 text-3xl font-bold mb-4">₹{availableBalance}</Text>

                            <Text className="text-gray-500 text-sm mb-2">Withdraw Amount</Text>
                            <View className="flex-row gap-3">
                                <TextInput
                                    className="flex-1 bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-lg text-gray-900 dark:text-white"
                                    placeholder="Min ₹100"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={setAmount}
                                />
                                <TouchableOpacity
                                    className={`px-6 py-3 rounded-lg ${availableBalance >= 100 ? 'bg-green-600' : 'bg-gray-400'}`}
                                    onPress={handleRequestPayout}
                                    disabled={requesting || availableBalance < 100}
                                >
                                    {requesting ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <Text className="text-white font-bold">Withdraw</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Payout History */}
                        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">Payout History</Text>
                        <FlatList
                            data={payouts}
                            renderItem={renderPayoutItem}
                            keyExtractor={(item) => item.id.toString()}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            ListEmptyComponent={
                                <View className="items-center justify-center py-10">
                                    <Text className="text-gray-400">No payouts yet</Text>
                                </View>
                            }
                        />
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}
