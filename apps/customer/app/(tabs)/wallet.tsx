import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TRANSACTIONS = [
    { id: '1', title: 'Top up', amount: '+₹500', date: '22 Aug, 10:30 AM', type: 'credit' },
    { id: '2', title: 'Trip Payment', amount: '-₹120', date: '21 Aug, 05:45 PM', type: 'debit' },
    { id: '3', title: 'Refund', amount: '+₹50', date: '20 Aug, 12:00 PM', type: 'credit' },
];

export default function WalletTab() {

    const renderItem = ({ item }: { item: typeof TRANSACTIONS[0] }) => (
        <View className="flex-row justify-between items-center py-4 px-2">
            <View className="flex-row items-center gap-3">
                <View className={`h-10 w-10 rounded-full items-center justify-center ${item.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                    <MaterialIcons name={item.type === 'credit' ? "add" : "remove"} size={20} color={item.type === 'credit' ? "green" : "red"} />
                </View>
                <View>
                    <Text className="text-text-primary font-semibold text-base">{item.title}</Text>
                    <Text className="text-text-secondary text-xs">{item.date}</Text>
                </View>
            </View>
            <Text className={`text-base font-bold ${item.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>{item.amount}</Text>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex-1 p-6">
                <Text className="text-2xl font-bold mb-6 mt-4 text-text-primary">Wallet</Text>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    {/* Balance Card */}
                    <View className="bg-text-primary rounded-3xl p-6 mb-8 shadow-xl">
                        <Text className="text-gray-400 text-sm mb-1 font-medium">Total Balance</Text>
                        <Text className="text-white text-4xl font-bold mb-8">₹1,250.00</Text>
                        <View className="flex-row gap-3">
                            <TouchableOpacity className="flex-1 bg-primary py-3.5 rounded-2xl items-center shadow-md">
                                <Text className="text-white font-bold">Add Money</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="flex-1 bg-gray-800 py-3.5 rounded-2xl items-center border border-gray-700">
                                <Text className="text-white font-bold">History</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Payment Methods */}
                    <View className="mb-8">
                        <Text className="text-lg font-bold text-text-primary mb-4">Payment Methods</Text>
                        <View className="gap-4">
                            <TouchableOpacity className="flex-row items-center justify-between p-4 bg-surface rounded-2xl border border-border shadow-sm">
                                <View className="flex-row items-center gap-3">
                                    <View className="h-12 w-12 bg-gray-50 rounded-full items-center justify-center">
                                        <MaterialIcons name="credit-card" size={24} color="#0F172A" />
                                    </View>
                                    <View>
                                        <Text className="text-text-primary font-semibold text-base">Mastercard</Text>
                                        <Text className="text-text-secondary text-sm">**** 1234</Text>
                                    </View>
                                </View>
                                <View className="bg-primary/10 px-3 py-1.5 rounded-full">
                                    <Text className="text-primary font-bold text-xs">Default</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity className="flex-row items-center gap-4 p-4 bg-surface rounded-2xl border border-dashed border-primary">
                                <View className="h-12 w-12 bg-primary/5 rounded-full items-center justify-center">
                                    <MaterialIcons name="add" size={24} color="#0F766E" />
                                </View>
                                <Text className="text-primary font-semibold text-base">Add New Card</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Transactions */}
                    <View>
                        <Text className="text-lg font-bold text-text-primary mb-4">Recent Transactions</Text>
                        <View className="bg-surface rounded-2xl p-2 border border-border/50">
                            <FlatList
                                data={TRANSACTIONS}
                                renderItem={renderItem}
                                keyExtractor={item => item.id}
                                scrollEnabled={false}
                                ItemSeparatorComponent={() => <View className="h-[1px] bg-border/50" />}
                            />
                        </View>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
