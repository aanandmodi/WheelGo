import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

export default function KYCSuccessScreen() {
    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 justify-between">
                <View>
                    {/* Header */}
                    <View className="flex-row items-center p-4">
                        <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center">
                            <MaterialIcons name="arrow-back" size={24} color="#111817" />
                        </TouchableOpacity>
                        <Text className="flex-1 text-center text-lg font-bold pr-10 text-[#111817]">KYC</Text>
                    </View>

                    <View className="items-center mt-10 px-4">
                        <View className="bg-green-100 rounded-full p-6 mb-6">
                            <MaterialIcons name="check-circle" size={80} color="#00897B" />
                        </View>
                        <Text className="text-[22px] font-bold text-[#111817] text-center mb-2">Verified badge activated</Text>
                        <Text className="text-base text-center text-[#111817]">You can now rent vehicles from any of our partners</Text>
                    </View>
                </View>

                {/* Footer */}
                <View className="p-4 pb-8">
                    <TouchableOpacity onPress={() => router.push('/(tabs)')} className="w-full bg-[#0df2db] h-12 rounded-lg items-center justify-center">
                        <Text className="text-[#111817] font-bold text-base">Continue</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
