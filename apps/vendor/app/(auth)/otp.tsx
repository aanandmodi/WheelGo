import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/constants/Api';

export default function OTPScreen() {
    const { login } = useAuth();
    const { phone } = useLocalSearchParams();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const inputs = useRef<Array<TextInput | null>>([]);

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
                login('vendor', data.access, data.refresh);

                if (data.has_vendor_profile) {
                    router.replace('/(tabs)');
                } else {
                    router.replace('/(auth)/setup-profile');
                }
            } else {
                alert(data.error || "Verification failed");
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

        // Auto-Verify
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
        <SafeAreaView className="flex-1 bg-white dark:bg-[#121212]">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 px-4 justify-center"
            >
                <View>
                    <TouchableOpacity onPress={() => router.back()} className="h-12 w-12 items-center justify-center -ml-2 mb-4">
                        <MaterialIcons name="arrow-back" size={24} color="#3B82F6" />
                    </TouchableOpacity>

                    <Text className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">Verify Account</Text>
                    <Text className="text-base text-center text-gray-500 dark:text-gray-400 mb-8">
                        Enter the code sent to {phone}
                    </Text>

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
                                className="w-12 h-14 border border-gray-300 dark:border-gray-700 rounded-xl text-center text-xl font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-[#1E1E1E]"
                                selectTextOnFocus
                                editable={!loading}
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={() => handleVerify(otp.join(''))}
                        className={`h-14 bg-blue-600 rounded-xl justify-center items-center shadow-lg shadow-blue-500/30 ${loading ? 'opacity-70' : ''}`}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white text-lg font-bold">Verify & Login</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
