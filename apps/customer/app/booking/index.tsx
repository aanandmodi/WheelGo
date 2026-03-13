import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';

export default function BookingScreen() {
    const [duration, setDuration] = useState('1 Day');

    const handlePayment = () => {
        // Navigate to dummy payment success / processing
        router.replace('/(tabs)/history');
        alert('Booking Confirmed! (Mock)');
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <Stack.Screen options={{ title: 'Confirm Booking' }} />
            <ScrollView className="flex-1 p-5">
                <Card className="mb-6">
                    <Text className="text-gray-500 font-medium mb-1">Vehicle</Text>
                    <Text className="text-xl font-bold mb-4">Honda Activa 6G</Text>

                    <View className="h-px bg-gray-100 mb-4" />

                    <View className="flex-row justify-between mb-4">
                        <View>
                            <Text className="text-gray-500 text-xs">Pickup</Text>
                            <Text className="font-bold">Dec 22, 10:00 AM</Text>
                        </View>
                        <View>
                            <Text className="text-gray-500 text-xs text-right">Dropoff</Text>
                            <Text className="font-bold text-right">Dec 23, 10:00 AM</Text>
                        </View>
                    </View>

                    <View className="bg-gray-100 p-3 rounded-lg">
                        <Text className="text-center font-bold text-gray-700">Duration: 1 Day</Text>
                    </View>
                </Card>

                <Text className="text-lg font-bold mb-3">Payment Summary</Text>
                <Card className="mb-20">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-gray-600">Rental Fee (1 Day)</Text>
                        <Text className="font-bold">₹350</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-gray-600">Service Fee</Text>
                        <Text className="font-bold">₹20</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-gray-600">Security Deposit</Text>
                        <Text className="font-bold text-green-600">₹0 (Waived)</Text>
                    </View>
                    <View className="h-px bg-gray-200 my-2" />
                    <View className="flex-row justify-between">
                        <Text className="text-lg font-bold">Total</Text>
                        <Text className="text-lg font-bold text-primary">₹370</Text>
                    </View>
                </Card>

            </ScrollView>

            <View className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100">
                <Button title="Pay ₹370 & Book" onPress={handlePayment} />
            </View>
        </SafeAreaView>
    );
}
