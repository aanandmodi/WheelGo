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
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 px-6 justify-center"
            >
                <View>
                    <TouchableOpacity onPress={() => router.back()} className="h-12 w-12 items-center justify-center -ml-2 mb-4">
                        <MaterialIcons name="arrow-back" size={24} color="#0F1115" />
                    </TouchableOpacity>

                    <Text className="text-3xl font-bold text-center mb-2 text-gray-900">Verify Account</Text>
                    <Text className="text-base text-center text-gray-500 mb-8">
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
                                className="w-12 h-14 border border-gray-200 rounded-2xl text-center text-xl font-medium text-gray-900 bg-white"
                                selectTextOnFocus
                                editable={!loading}
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={() => handleVerify(otp.join(''))}
                        className={`h-14 bg-primary rounded-full justify-center items-center shadow-lg shadow-gray-900/10 ${loading ? 'opacity-70' : ''}`}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white text-base font-bold">Verify & Login</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
