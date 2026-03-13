import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function BookingConfirmation() {
    return (
        <SafeAreaView className="flex-1 bg-[#F5F5F5] dark:bg-[#121212]">
            <View className="flex-1">
                {/* Header */}
                <View className="flex-row items-center p-4 bg-white dark:bg-[#1E1E1E] shadow-sm">
                    <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center">
                        <MaterialIcons name="arrow-back" size={24} color="#212121" />
                    </TouchableOpacity>
                    <Text className="flex-1 text-center text-lg font-semibold text-[#212121] dark:text-white pr-10">Booking Confirmation</Text>
                </View>

                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                    {/* Confirmation Card */}
                    <View className="bg-white dark:bg-[#1E1E1E] rounded-xl p-6 items-center shadow-lg mb-6">
                        <View className="h-16 w-16 rounded-full bg-[#F9A825] items-center justify-center mb-4">
                            <MaterialIcons name="check" size={32} color="white" />
                        </View>
                        <Text className="text-2xl font-bold text-[#212121] dark:text-white text-center mb-2">Your Booking is Confirmed!</Text>

                        <View className="w-full max-w-[240px] aspect-square bg-white rounded-xl border border-gray-200 mt-4 overflow-hidden p-2">
                            <Image
                                source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCnzixF9Vfw5w4Cv56bym9xQjF1jFrE7FE0BAGWcxIuLLXdXFcbqbZfvOt7AVXMAmPj-fiL2dXqoOK2CFb51odNvKmzGicYR03CSzttNeauJbSjffoVpqlumGA-hdFSc2xurHY5kGlU_sR0gbYocvCP4hVGf6HKn_r8UxJJ6l8kW4E9ONHZu_zPHZER_tPEYD9Sfb-kzSWDj425zuoGVuAzygGyZLdGU6gj9rGZJoEOZh5S-44vVb7Z8zlcF0ofrZ_qEwY69bnAsF4" }}
                                className="w-full h-full rounded-lg"
                                resizeMode="cover"
                            />
                        </View>
                        <Text className="text-center text-gray-500 mt-2 text-sm">Show this QR at the shop to pick up your vehicle.</Text>
                    </View>

                    {/* Pickup Details */}
                    <View className="bg-white dark:bg-[#1E1E1E] rounded-xl p-5 mb-6 shadow-lg gap-4">
                        <Text className="text-lg font-bold text-[#212121] dark:text-white">Pickup Details</Text>
                        <View className="w-full h-32 rounded-xl overflow-hidden bg-gray-200">
                            <Image
                                source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBPBSXVEWRuLtnPXXbqM-73MiVzw5U-KR7U78nfUPSPutFtKqUH5DgDOD6ou-DfF-497GZ5egf7nk8gSLoljT9jgaxb4ivGUxUMIek2KBtn8VFHQKkW6Cg6YdCZeyRU0Tag8aR-tRBXCrTsvjWQxirfvSexBq6CyvBnBbINeJZBNZwfvKxWeiBOBj_7Pp_dehT8UQ2P0ciWwb0WP6-wzCrudOAYdjSXW1t3rFKEY6tyBM7KnUpkhQxm0EDT1N1XcZr2MKA2KA07yb4" }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        </View>
                        <View>
                            <Text className="font-semibold text-[#212121] dark:text-white">WheelGo Rentals - Koramangala</Text>
                            <Text className="text-sm text-gray-500 mt-1">#123, 5th Cross, 6th Block, Koramangala, Bengaluru, Karnataka 560095</Text>
                        </View>
                        <TouchableOpacity className="flex-row items-center justify-center bg-[#00897B] py-3 rounded-full gap-2">
                            <MaterialIcons name="navigation" size={20} color="white" />
                            <Text className="text-white font-semibold">Get Directions</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Booking Summary */}
                    <View className="bg-white dark:bg-[#1E1E1E] rounded-xl p-5 shadow-lg gap-4">
                        <Text className="text-lg font-bold text-[#212121] dark:text-white">Your Booking</Text>
                        <View className="gap-3">
                            <View className="flex-row items-center gap-4">
                                <View className="h-10 w-10 items-center justify-center bg-[#00897B]/10 rounded-lg">
                                    <MaterialIcons name="two-wheeler" size={20} color="#00897B" />
                                </View>
                                <View>
                                    <Text className="text-gray-500 text-sm">Vehicle</Text>
                                    <Text className="font-semibold text-[#212121] dark:text-white">Honda Activa 6G</Text>
                                </View>
                            </View>
                            <View className="flex-row items-center gap-4">
                                <View className="h-10 w-10 items-center justify-center bg-[#00897B]/10 rounded-lg">
                                    <MaterialIcons name="calendar-today" size={20} color="#00897B" />
                                </View>
                                <View>
                                    <Text className="text-gray-500 text-sm">Pickup & Drop-off</Text>
                                    <Text className="font-semibold text-[#212121] dark:text-white">24 Aug, 10:00 AM - 25 Aug, 10:00 AM</Text>
                                </View>
                            </View>
                            <View className="flex-row items-center gap-4">
                                <View className="h-10 w-10 items-center justify-center bg-[#00897B]/10 rounded-lg">
                                    <MaterialIcons name="receipt" size={20} color="#00897B" />
                                </View>
                                <View>
                                    <Text className="text-gray-500 text-sm">Total Price</Text>
                                    <Text className="font-semibold text-[#212121] dark:text-white">₹ 450.00</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                </ScrollView>

                {/* Footer Actions */}
                <View className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#1E1E1E] border-t border-gray-200">
                    <TouchableOpacity onPress={() => router.push('/(tabs)/history')} className="w-full bg-[#00897B] py-3.5 rounded-full items-center mb-3">
                        <Text className="text-white font-semibold text-base">View My Bookings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="w-full items-center py-2">
                        <Text className="text-[#00897B] font-semibold text-base">Need Help?</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </SafeAreaView>
    );
}
