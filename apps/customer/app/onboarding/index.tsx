import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

export default function OnboardingScreen() {

    const handleNext = () => {
        router.replace('/(tabs)');
    };

    // Auto-navigate after 2.5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            handleNext();
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <TouchableOpacity activeOpacity={1} onPress={handleNext} className="flex-1 bg-primary justify-between">
            <SafeAreaView className="flex-1">
                <View className="flex-1 justify-center items-center pb-20">
                    <Text className="text-secondary text-[40px] font-bold tracking-wider mb-2 font-Outfit">
                        WheelGo
                    </Text>
                    <Text className="text-gray-400 text-sm font-semibold tracking-widest uppercase mb-12">
                        Premium Bike Rentals
                    </Text>

                    <View className="w-full px-12">
                        <View className="w-full aspect-[4/3] rounded-3xl overflow-hidden bg-white/5 items-center justify-center p-6 border border-white/5">
                            <Image
                                source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQnC8f7LeOLtWCT4KShd5i-9bCF-RqMgQmLNrFgGT_8SmClBA06q1oZxG1AO0ClVLC7Cz_Oo1T70006AnnYBe4vagkW6ewYRP5xQ7tEe1-T8YrIWZDS_Q5nvN6dO7iQPGHpBxNr0UvsQFl9MugbYCK1likwrvsn0B8wfoUdE59huKaTk8MBVJ9w2ynfr19roLkpOGOXKV3yzEfzK5f_HJ36H48DsNhmfNpJIfL4d_QmWRHfqI-vpMgoczaaKFaMxe9yh2TeOnVFTE" }}
                                className="w-full h-full opacity-90"
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                </View>

                <View className="pb-16 items-center">
                    <Text className="text-gray-300 text-base font-normal tracking-wide">
                        Your Ride. Your Rules.
                    </Text>
                    <Text className="text-gray-500 text-xs mt-4 uppercase tracking-widest">
                        Tap to skip
                    </Text>
                </View>
            </SafeAreaView>
        </TouchableOpacity>
    );
}
