import { Link, router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { API_URL } from '@/constants/Api';

export default function SignupScreen() {
    const [formData, setFormData] = useState({
        businessName: '',
        ownerName: '',
        email: '',
        phone: '',
        password: '',
    });

    const [loading, setLoading] = useState(false);
    const { phone: phoneParam } = useLocalSearchParams(); // Fixed: use hook directly

    React.useEffect(() => {
        if (phoneParam) {
            setFormData(prev => ({ ...prev, phone: phoneParam as string }));
        }
    }, [phoneParam]);

    const handleSignup = async () => {
        if (formData.phone.length !== 10) {
            alert("Please enter a valid 10-digit number");
            return;
        }

        setLoading(true);
        try {
            // 1. Check if user ALREADY exists
            const checkResponse = await fetch(`${API_URL}/users/check-user/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_number: formData.phone })
            });
            const checkData = await checkResponse.json();

            if (checkData.exists) {
                alert("Account already exists! Please Login.");
                router.replace('/(auth)/login');
                setLoading(false);
                return;
            }

            // 2. Send OTP
            const response = await fetch(`${API_URL}/users/send-otp/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_number: formData.phone })
            });

            if (response.ok) {
                // Navigate to OTP, carrying over profile data if possible? 
                // Actually, VerifyOTP redirects to SetupProfile. 
                // We can just let the user fill details again there, OR pass them via Context/Params.
                // For simplicity/reliability, let's rely on standard flow:
                // Signup -> OTP -> Setup Profile (User fills Shop details there).
                // The fields here (Business Name, Owner Name) duplicate SetupProfile.
                // Maybe we should just use Signup for Phone/Password(if used) and rely on SetupProfile for details?
                // The current UI asks for Business Name etc.
                // Let's pass them as params to OTP screen, then to Setup screen? Too messy.
                // Let's just navigate to OTP. The User "Creation" happens at Verify.
                // Then SetupProfile asks for details. 
                // We might want to "Pre-fill" SetupProfile if possible.
                // For now, minimal complexity: Signup validates phone -> OTP.
                router.push({ pathname: '/(auth)/otp', params: { phone: formData.phone } });
            } else {
                alert("Failed to send OTP");
            }

        } catch (error) {
            console.error(error);
            alert("Network Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#121212]">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="items-center mb-8">
                        <Text className="text-3xl font-bold text-gray-900 dark:text-white">
                            Create Account
                        </Text>
                        <Text className="text-gray-500 mt-2 text-center dark:text-gray-400">
                            Join the WheelGo partner network
                        </Text>
                    </View>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Business Name</Text>
                            <TextInput
                                className="w-full bg-gray-50 dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                                placeholder="e.g. Royal Riders"
                                placeholderTextColor="#9CA3AF"
                                value={formData.businessName}
                                onChangeText={(text) => setFormData({ ...formData, businessName: text })}
                            />
                        </View>

                        <View>
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Owner Name</Text>
                            <TextInput
                                className="w-full bg-gray-50 dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                                placeholder="John Doe"
                                placeholderTextColor="#9CA3AF"
                                value={formData.ownerName}
                                onChangeText={(text) => setFormData({ ...formData, ownerName: text })}
                            />
                        </View>

                        <View>
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Email Address</Text>
                            <TextInput
                                className="w-full bg-gray-50 dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                                placeholder="vendor@wheelgo.com"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                            />
                        </View>

                        <View>
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Phone Number</Text>
                            <TextInput
                                className="w-full bg-gray-50 dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                                placeholder="+91 98765 43210"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="phone-pad"
                                value={formData.phone}
                                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                            />
                        </View>

                        <View>
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Password</Text>
                            <TextInput
                                className="w-full bg-gray-50 dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                                placeholder="••••••••"
                                placeholderTextColor="#9CA3AF"
                                secureTextEntry
                                value={formData.password}
                                onChangeText={(text) => setFormData({ ...formData, password: text })}
                            />
                        </View>

                        <TouchableOpacity
                            className="w-full bg-blue-600 py-4 rounded-xl shadow-lg shadow-blue-500/30 mt-6"
                            onPress={handleSignup}
                        >
                            <Text className="text-white text-center font-bold text-lg">
                                Create Account
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row justify-center mt-8 mb-8">
                        <Text className="text-gray-500 dark:text-gray-400">
                            Already have an account?{' '}
                        </Text>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <Text className="text-blue-600 font-bold">Sign In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
