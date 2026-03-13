import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function TermsScreen() {
    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1">
                {/* Header */}
                <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
                    <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center -ml-2">
                        <MaterialIcons name="arrow-back" size={24} color="#111817" />
                    </TouchableOpacity>
                    <Text className="flex-1 text-center text-lg font-bold pr-10 text-[#111817]">Terms & Privacy</Text>
                </View>

                <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 40 }}>
                    <Text className="text-xl font-bold text-[#111817] mb-4">Terms of Service</Text>
                    <Text className="text-gray-600 mb-6 leading-6">
                        Welcome to WheelGo. By using our app, you agree to these terms. Please read them carefully.
                        {"\n"}{"\n"}
                        1. <Text className="font-bold text-[#111817]">Usage:</Text> You must be 18 years or older and hold a valid driving license to rent vehicles.
                        {"\n"}{"\n"}
                        2. <Text className="font-bold text-[#111817]">Responsibility:</Text> You are responsible for the vehicle during the rental period. Any damage or fines incurred are your liability.
                        {"\n"}{"\n"}
                        3. <Text className="font-bold text-[#111817]">Payments:</Text> Payments must be made in advance. Refunds are subject to our cancellation policy.
                    </Text>

                    <View className="h-px bg-gray-200 my-4" />

                    <Text className="text-xl font-bold text-[#111817] mb-4">Privacy Policy</Text>
                    <Text className="text-gray-600 mb-6 leading-6">
                        We value your privacy. This policy explains how we collect and use your data.
                        {"\n"}{"\n"}
                        • We collect personal info (name, phone, license) for verification.
                        {"\n"}
                        • Location data is used to track rides and find nearby vehicles.
                        {"\n"}
                        • We do not share your data with third parties without consent.
                    </Text>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
