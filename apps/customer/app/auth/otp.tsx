import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/constants/Api';
import { storeTokens } from '@/constants/ApiService';

export default function OTPScreen() {
    const { login } = useAuth();
    const { phone } = useLocalSearchParams();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const inputs = useRef<Array<TextInput | null>>([]);
    const [timeLeft, setTimeLeft] = useState(59);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleVerify = async (otpValue: string) => {
        if (otpValue.length !== 6) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/users/verify-otp/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_number: phone || '9876543210', otp: otpValue })
            });

            const data = await response.json();
            if (response.ok) {
                // Store tokens for authenticated API calls
                await storeTokens(data.access, data.refresh);

                login('consumer', data.access, data.refresh);
                if (data.new_user) {
                    router.replace('/kyc/instant');
                } else {
                    router.replace('/(tabs)');
                }
            } else {
                alert(data.error || "Verification failed");
                // Clear OTP on specific errors if needed, focusing first input
                if (data.error === "Invalid OTP") {
                    setOtp(['', '', '', '', '', '']);
                    inputs.current[0]?.focus();
                }
            }
        } catch (err) {
            alert("Verify request failed");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        if (text && index < 5) {
            inputs.current[index + 1]?.focus();
        }

        // Auto-Verify when filled
        if (newOtp.every(d => d !== '') && text) {
            handleVerify(newOtp.join(''));
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 px-4 justify-between"
            >
                <View>
                    {/* Header */}
                    <View className="flex-row items-center py-4">
                        <TouchableOpacity onPress={() => router.back()} className="h-12 w-12 items-center justify-center -ml-2">
                            <MaterialIcons name="arrow-back" size={24} color="#101818" />
                        </TouchableOpacity>
                        <Text className="flex-1 text-center text-lg font-bold pr-10 text-[#101818]">OTP Verification</Text>
                    </View>

                    <Text className="text-[22px] font-bold text-center mt-5 mb-2 text-[#101818]">Enter the 6-digit code</Text>
                    <Text className="text-base text-center text-[#101818] mb-8">We've sent a verification code to +91 {phone}</Text>

                    {/* OTP Inputs */}
                    <View className="flex-row justify-center gap-2 mb-8">
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => { inputs.current[index] = ref; }}
                                value={digit}
                                onChangeText={(text) => handleChange(text, index)}
                                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                className="w-12 h-14 border-b border-[#dae7e5] text-center text-xl font-medium text-[#101818]"
                                selectTextOnFocus
                                editable={!loading}
                            />
                        ))}
                    </View>

                    {/* Timer */}
                    <View className="flex-row justify-center gap-4 mb-8">
                        <View className="items-center">
                            <View className="h-14 w-16 bg-[#f0f5f4] rounded-xl items-center justify-center mb-1">
                                <Text className="text-lg font-bold text-[#101818]">00</Text>
                            </View>
                            <Text className="text-sm text-[#101818]">Hours</Text>
                        </View>
                        <View className="items-center">
                            <View className="h-14 w-16 bg-[#f0f5f4] rounded-xl items-center justify-center mb-1">
                                <Text className="text-lg font-bold text-[#101818]">00</Text>
                            </View>
                            <Text className="text-sm text-[#101818]">Minutes</Text>
                        </View>
                        <View className="items-center">
                            <View className="h-14 w-16 bg-[#f0f5f4] rounded-xl items-center justify-center mb-1">
                                <Text className="text-lg font-bold text-[#101818]">{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</Text>
                            </View>
                            <Text className="text-sm text-[#101818]">Seconds</Text>
                        </View>
                    </View>
                </View>

                {/* Buttons */}
                <View className="pb-10 gap-3">
                    <TouchableOpacity
                        onPress={() => handleVerify(otp.join(''))}
                        className={`h-12 bg-[#008a7c] rounded-full justify-center items-center ${loading ? 'opacity-70' : ''}`}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white text-base font-bold">Verify</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity className="h-12 bg-transparent rounded-full justify-center items-center">
                        <Text className="text-[#101818] text-base font-bold">Resend OTP</Text>
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
