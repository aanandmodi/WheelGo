
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';


export default function OnboardingScreen() {

    const handleNext = () => {
        router.replace('/(tabs)');
    };

    // Auto-navigate after 3 seconds (optional, but typical for splash)
    useEffect(() => {
        const timer = setTimeout(() => {
            handleNext();
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <TouchableOpacity activeOpacity={1} onPress={handleNext} className="flex-1 bg-white justify-between">
            <SafeAreaView className="flex-1">
                <View className="flex-1 justify-center pb-20">
                    <Text className="text-[#111817] text-[32px] font-bold leading-tight px-4 text-center pb-8">
                        WheelGo
                    </Text>

                    <View className="w-full px-6">
                        <View className="w-full aspect-[4/3] rounded-2xl overflow-hidden">
                            <Image
                                source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQnC8f7LeOLtWCT4KShd5i-9bCF-RqMgQmLNrFgGT_8SmClBA06q1oZxG1AO0ClVLC7Cz_Oo1T70006AnnYBe4vagkW6ewYRP5xQ7tEe1-T8YrIWZDS_Q5nvN6dO7iQPGHpBxNr0UvsQFl9MugbYCK1likwrvsn0B8wfoUdE59huKaTk8MBVJ9w2ynfr19roLkpOGOXKV3yzEfzK5f_HJ36H48DsNhmfNpJIfL4d_QmWRHfqI-vpMgoczaaKFaMxe9yh2TeOnVFTE" }}
                                className="w-full h-full"
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                </View>

                <View className="pb-16">
                    <Text className="text-[#111817] text-lg font-normal leading-normal px-4 text-center">
                        Your Ride, Your Rules
                    </Text>
                </View>
            </SafeAreaView>
        </TouchableOpacity>
    );
}

