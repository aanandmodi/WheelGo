import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, SafeAreaView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

export default function DigiLockerConnectScreen() {

    useEffect(() => {
        // Mock connection process
        const timer = setTimeout(() => {
            router.replace('/kyc/instant');
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-white items-center justify-center">
            <View className="items-center px-8 w-full">

                <Animated.View entering={ZoomIn.duration(800)} className="mb-10 relative">
                    <View className="h-32 w-32 bg-blue-50 rounded-full items-center justify-center border-4 border-blue-100">
                        <MaterialIcons name="cloud-upload" size={60} color="#2563EB" />
                    </View>
                    <Animated.View
                        entering={FadeIn.delay(500)}
                        className="absolute -bottom-2 -right-2 h-12 w-12 bg-green-500 rounded-full items-center justify-center border-4 border-white"
                    >
                        <MaterialIcons name="check" size={28} color="white" />
                    </Animated.View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300)} className="items-center w-full">
                    <Text className="text-2xl font-bold text-[#111817] mb-3 text-center">Connecting to DigiLocker</Text>
                    <Text className="text-gray-500 text-center mb-8 leading-6">
                        Please wait while we securely fetch your driving license details to verify your identity.
                    </Text>

                    <View className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-4">
                        <Animated.View
                            entering={FadeIn.duration(2000)}
                            style={{ width: '60%' }}
                            className="h-full bg-[#00897B] rounded-full"
                        />
                    </View>

                    <View className="flex-row items-center gap-2">
                        <ActivityIndicator size="small" color="#00897B" />
                        <Text className="text-[#00897B] font-medium text-sm">Verifying Credentials...</Text>
                    </View>
                </Animated.View>

            </View>
        </SafeAreaView>
    );
}
