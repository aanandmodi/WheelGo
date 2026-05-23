import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, Text, View, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { getBikeDetails, createBooking, createOrder, verifyPayment } from '@/constants/ApiService';
import RazorpayCheckout from 'react-native-razorpay';

export default function BookingScreen() {
    const { id, startDate: paramStartDate, endDate: paramEndDate } = useLocalSearchParams<{
        id: string;
        startDate?: string;
        endDate?: string;
    }>();
    
    const { user } = useAuth();
    const [bike, setBike] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);

    // Set default dates if not provided
    const defaultStart = new Date(Date.now() + 2 * 3600 * 1000); // 2 hours from now
    const defaultEnd = new Date(Date.now() + 26 * 3600 * 1000);   // 26 hours from now
    
    const [startDate, setStartDate] = useState(paramStartDate || defaultStart.toISOString());
    const [endDate, setEndDate] = useState(paramEndDate || defaultEnd.toISOString());

    useEffect(() => {
        if (id) {
            getBikeDetails(id)
                .then(setBike)
                .catch(err => {
                    console.error("Failed to load bike details:", err);
                    Alert.alert("Error", "Could not load bike details.");
                })
                .finally(() => setLoading(false));
        }
    }, [id]);

    const dateStart = new Date(startDate);
    const dateEnd = new Date(endDate);
    const durationMs = dateEnd.getTime() - dateStart.getTime();
    const durationHours = Math.max(1, Math.round(durationMs / (3600 * 1000)));
    const durationDays = Math.ceil(durationHours / 24);

    const rentalFee = bike ? Number(bike.price_per_hour) * durationHours : 0;
    const serviceFee = 20;
    const totalAmount = rentalFee + serviceFee;

    const handlePayment = async () => {
        if (!user) {
            Alert.alert("Login Required", "You must be logged in to book a bike.");
            return;
        }

        try {
            setPaying(true);
            
            // Step 1: Create booking on backend
            const booking = await createBooking(Number(id), startDate, endDate);
            
            // Step 2: Create Razorpay order on backend
            const order = await createOrder(booking.id);
            
            // Step 3: Open Razorpay checkout options
            const options = {
                description: `WheelGo Ride — ${bike.brand} ${bike.model}`,
                image: 'https://wheelgo.in/assets/logo.png',
                currency: 'INR',
                key: order.key,
                amount: order.amount,
                name: 'WheelGo',
                order_id: order.order_id,
                prefill: {
                    contact: user.phone_number,
                    name: user.full_name || ''
                },
                theme: { color: '#FF6B35' }
            };

            try {
                const paymentData = await RazorpayCheckout.open(options);
                
                // Step 4: Verify payment on backend
                await verifyPayment({
                    bookingId: booking.id,
                    orderId: order.order_id,
                    paymentId: paymentData.razorpay_payment_id,
                    signature: paymentData.razorpay_signature,
                });
                
                router.replace({
                    pathname: '/booking/confirmation',
                    params: { bookingId: booking.id }
                });
            } catch (sdkError: any) {
                console.warn("Razorpay Checkout failed/skipped (SDK not loaded?):", sdkError);
                
                // In expo dev or simulation environments, allow simulating payment verification
                if (__DEV__) {
                    Alert.alert(
                        "Simulator Payment",
                        "Razorpay Native SDK is missing. Simulate payment verification on backend?",
                        [
                            {
                                text: "Simulate Success",
                                onPress: async () => {
                                    try {
                                        await verifyPayment({
                                            bookingId: booking.id,
                                            orderId: order.order_id,
                                            paymentId: 'mock_payment_' + Math.random().toString(36).substring(7),
                                            signature: 'mock_signature_hash',
                                        });
                                        router.replace({
                                            pathname: '/booking/confirmation',
                                            params: { bookingId: booking.id }
                                        });
                                    } catch (e: any) {
                                        Alert.alert("Simulated Verification Failed", e.message);
                                    }
                                }
                            },
                            {
                                text: "Simulate Failure",
                                onPress: () => router.replace('/booking/failure'),
                                style: "destructive"
                            }
                        ]
                    );
                } else {
                    throw sdkError;
                }
            }
        } catch (err: any) {
            console.error("Booking payment flow error:", err);
            Alert.alert('Payment Failed', err.message || 'Please try again.');
            router.replace('/booking/failure');
        } finally {
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-surface items-center justify-center">
                <ActivityIndicator size="large" color="#FF6B35" />
                <Text className="text-gray-500 mt-2">Loading booking details...</Text>
            </SafeAreaView>
        );
    }

    if (!bike) {
        return (
            <SafeAreaView className="flex-1 bg-surface items-center justify-center">
                <Text className="text-gray-500">Bike information not found.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <Stack.Screen options={{ title: 'Confirm Booking', headerShown: true }} />
            <ScrollView className="flex-1 p-5">
                <Card className="mb-6 bg-white p-4 rounded-2xl border border-gray-100">
                    <Text className="text-gray-500 font-medium mb-1 text-xs">Vehicle</Text>
                    <Text className="text-xl font-bold mb-4 text-[#1A1A2E]">{bike.brand} {bike.model}</Text>

                    <View className="h-px bg-gray-100 mb-4" />

                    <View className="flex-row justify-between mb-4">
                        <View>
                            <Text className="text-gray-400 text-[10px] uppercase font-bold">Pickup</Text>
                            <Text className="font-bold text-gray-700 mt-0.5">
                                {dateStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}, {dateStart.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                        <View>
                            <Text className="text-gray-400 text-[10px] uppercase font-bold text-right">Dropoff</Text>
                            <Text className="font-bold text-gray-700 mt-0.5 text-right">
                                {dateEnd.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}, {dateEnd.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>

                    <View className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <Text className="text-center font-bold text-gray-600">
                            Duration: {durationHours} hr{durationHours > 1 ? 's' : ''} ({durationDays} Day{durationDays > 1 ? 's' : ''})
                        </Text>
                    </View>
                </Card>

                <Text className="text-base font-bold mb-3 text-[#1A1A2E]">Payment Summary</Text>
                <Card className="mb-20 bg-white p-4 rounded-2xl border border-gray-100">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-gray-600">Rental Fee (₹{bike.price_per_hour}/hr)</Text>
                        <Text className="font-bold text-[#1A1A2E]">₹{rentalFee}</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-gray-600">Service Fee</Text>
                        <Text className="font-bold text-[#1A1A2E]">₹{serviceFee}</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-gray-600">Security Deposit</Text>
                        <Text className="font-bold text-green-600">₹0 (Waived)</Text>
                    </View>
                    <View className="h-px bg-gray-100 my-3" />
                    <View className="flex-row justify-between">
                        <Text className="text-lg font-bold text-[#1A1A2E]">Total</Text>
                        <Text className="text-lg font-bold text-[#FF6B35]">₹{totalAmount}</Text>
                    </View>
                </Card>
            </ScrollView>

            <View className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100">
                <Button 
                    title={paying ? "Processing Payment..." : `Pay ₹${totalAmount} & Book`} 
                    onPress={handlePayment} 
                    disabled={paying}
                />
            </View>
        </SafeAreaView>
    );
}
