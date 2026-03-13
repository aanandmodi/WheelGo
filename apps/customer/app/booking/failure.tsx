import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

export default function BookingFailure() {
    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#102220]">
            <View className="flex-1 px-6 pb-6">
                {/* Header */}
                <View className="flex-row items-center py-4">
                    <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                        <MaterialIcons name="arrow-back" size={24} color="#111817" />
                    </TouchableOpacity>
                </View>

                <View className="flex-1 justify-center items-center">
                    <View className="size-24 items-center justify-center rounded-full bg-red-100 mb-8">
                        <MaterialIcons name="error" size={48} color="#EF4444" />
                    </View>

                    <Text className="text-2xl font-bold text-[#111817] dark:text-white text-center mb-2">Payment Failed</Text>
                    <Text className="text-center text-gray-500 dark:text-gray-400 max-w-xs text-base">
                        Your bank declined the transaction. Please check your card details or try another payment method.
                    </Text>
                </View>

                {/* Footer */}
                <View className="gap-3">
                    <TouchableOpacity onPress={() => router.back()} className="w-full bg-[#F9A825] py-4 rounded-full items-center">
                        <Text className="text-white font-bold text-base">Retry Payment</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="w-full py-4 rounded-full items-center">
                        <Text className="text-[#00897B] font-bold text-base">Contact Support</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </SafeAreaView>
    );
}
