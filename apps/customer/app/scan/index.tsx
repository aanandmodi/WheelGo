import { router, Stack } from 'expo-router';
import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

export default function ScanScreen() {
    const handleScan = () => {
        // Simulate scan success
        router.replace('/ride');
    };

    return (
        <SafeAreaView className="flex-1 bg-black">
            <Stack.Screen options={{ title: 'Scan QR Code', headerTintColor: 'white', headerStyle: { backgroundColor: 'black' } }} />

            <View className="flex-1 justify-center items-center">
                <View className="w-64 h-64 border-2 border-primary rounded-3xl justify-center items-center relative opacity-80">
                    <View className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white -mt-1 -ml-1" />
                    <View className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white -mt-1 -mr-1" />
                    <View className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white -mb-1 -ml-1" />
                    <View className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white -mb-1 -mr-1" />

                    <Text className="text-white opacity-50">Scanning...</Text>
                </View>

                <Text className="text-white mt-8 text-center px-10">Align the QR code on the bike within the frame to unlock.</Text>

                <TouchableOpacity onPress={handleScan} className="mt-20">
                    <View className="bg-primary px-8 py-3 rounded-full">
                        <Text className="text-white font-bold">Simulate Scan</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
