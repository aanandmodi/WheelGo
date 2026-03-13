import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, Text, View } from 'react-native';

export default function KycScreen() {
    const [step, setStep] = useState(1); // 1: Intro, 2: Processing, 3: Success

    const handleConnect = () => {
        setStep(2);
        // Simulate API call
        setTimeout(() => {
            setStep(3);
        }, 2000);
    };

    const handleFinish = () => {
        router.back();
    };

    return (
        <SafeAreaView className="flex-1 bg-white p-6">
            <Stack.Screen options={{ title: 'Identity Verification' }} />

            <View className="flex-1 justify-center items-center">
                {step === 1 && (
                    <>
                        <View className="w-32 h-32 bg-blue-50 rounded-full justify-center items-center mb-8">
                            <Text className="text-6xl">🆔</Text>
                        </View>
                        <Text className="text-2xl font-bold text-center mb-2">Verify with DigiLocker</Text>
                        <Text className="text-gray-500 text-center mb-10 px-6">
                            WheelGo partners with DigiLocker to instantly verify your Driving License without uploading photos manually.
                        </Text>

                        <Card variant="outlined" className="w-full mb-8 flex-row items-center justify-center py-4 border-blue-200 bg-blue-50">
                            <Text className="font-bold text-blue-800">🔒 100% Secure & Government Approved</Text>
                        </Card>

                        <Button title="Connect DigiLocker" onPress={handleConnect} className="w-full" />
                    </>
                )}

                {step === 2 && (
                    <View className="items-center">
                        <Text className="text-lg font-bold mb-4">Verifying...</Text>
                        <Text className="text-gray-500">Please wait while we fetch your documents.</Text>
                    </View>
                )}

                {step === 3 && (
                    <>
                        <View className="w-32 h-32 bg-green-50 rounded-full justify-center items-center mb-8">
                            <Text className="text-6xl">✅</Text>
                        </View>
                        <Text className="text-2xl font-bold text-center mb-2">Verification Successful!</Text>
                        <Text className="text-gray-500 text-center mb-10">
                            Your Driving License has been verified. You can now book rides instantly without deposits.
                        </Text>
                        <Button title="Continue" onPress={handleFinish} className="w-full" />
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}
