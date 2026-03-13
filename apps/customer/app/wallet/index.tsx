import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { FlatList, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const TRANSACTIONS = [
    { id: '1', title: 'Top up', amount: '+₹500', date: '22 Aug, 10:30 AM', type: 'credit' },
    { id: '2', title: 'Trip Payment', amount: '-₹120', date: '21 Aug, 05:45 PM', type: 'debit' },
    { id: '3', title: 'Refund', amount: '+₹50', date: '20 Aug, 12:00 PM', type: 'credit' },
];

export default function WalletScreen() {

    const renderItem = ({ item }) => (
        <View className="flex-row justify-between items-center py-4 border-b border-gray-100">
            <View className="flex-row items-center gap-3">
                <View className={`h-10 w-10 rounded-full items-center justify-center ${item.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                    <MaterialIcons name={item.type === 'credit' ? "add" : "remove"} size={20} color={item.type === 'credit' ? "green" : "red"} />
                </View>
                <View>
                    <Text className="text-[#111817] font-semibold text-base">{item.title}</Text>
                    <Text className="text-gray-400 text-xs">{item.date}</Text>
                </View>
            </View>
            <Text className={`text-base font-bold ${item.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>{item.amount}</Text>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1">
                {/* Header */}
                <View className="flex-row items-center px-4 py-4">
                    <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center -ml-2">
                        <MaterialIcons name="arrow-back" size={24} color="#111817" />
                    </TouchableOpacity>
                    <Text className="flex-1 text-center text-lg font-bold pr-10 text-[#111817]">Wallet</Text>
                </View>

                <ScrollView className="px-4">
                    {/* Balance Card */}
                    <View className="bg-[#111817] rounded-2xl p-6 mb-6 shadow-lg">
                        <Text className="text-gray-400 text-sm mb-1">Total Balance</Text>
                        <Text className="text-white text-4xl font-bold mb-6">₹1,250.00</Text>
                        <View className="flex-row gap-3">
                            <TouchableOpacity className="flex-1 bg-[#00897B] py-3 rounded-xl items-center">
                                <Text className="text-white font-bold">Add Money</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="flex-1 bg-[#2C2C2C] py-3 rounded-xl items-center border border-gray-700">
                                <Text className="text-white font-bold">History</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Payment Methods */}
                    <View className="mb-6">
                        <Text className="text-lg font-bold text-[#111817] mb-3">Payment Methods</Text>
                        <TouchableOpacity className="flex-row items-center justify-between p-4 bg-gray-50 rounded-xl mb-2 border border-gray-100">
                            <View className="flex-row items-center gap-3">
                                <MaterialIcons name="credit-card" size={24} color="#111817" />
                                <Text className="text-[#111817] font-semibold">**** 1234</Text>
                            </View>
                            <Text className="text-primary font-medium text-sm">Default</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="flex-row items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <MaterialIcons name="add" size={24} color="#00897B" />
                            <Text className="text-[#00897B] font-semibold">Add New Card</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Transactions */}
                    <View className="pb-10">
                        <Text className="text-lg font-bold text-[#111817] mb-2">Recent Transactions</Text>
                        <FlatList
                            data={TRANSACTIONS}
                            renderItem={renderItem}
                            keyExtractor={item => item.id}
                            scrollEnabled={false}
                        />
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
