import { Link, router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/constants/Api';

import { useAuth } from '@/context/AuthContext';

// Complete any pending auth sessions
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const { login } = useAuth();
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Google OAuth configuration
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: '790692602816-h5rmn2h4oc4p663si5mb4lla0jbpuag4.apps.googleusercontent.com',
        androidClientId: '790692602816-h5rmn2h4oc4p663si5mb4lla0jbpuag4.apps.googleusercontent.com',
    });

    // Handle Google Sign-In response
    useEffect(() => {
        if (response?.type === 'success') {
            handleGoogleSignIn(response.authentication?.accessToken);
        }
    }, [response]);

    const handleGoogleSignIn = async (accessToken: string | undefined) => {
        if (!accessToken) {
            Alert.alert('Error', 'Failed to get Google access token');
            return;
        }

        setGoogleLoading(true);
        try {
            // Get user info from Google
            const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const userInfo = await userInfoResponse.json();

            // Send to backend for authentication
            const backendResponse = await fetch(`${API_URL}/users/firebase-auth/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firebase_token: accessToken,
                    email: userInfo.email,
                    name: userInfo.name,
                    google_id: userInfo.id,
                    provider: 'google'
                })
            });

            if (backendResponse.ok) {
                const data = await backendResponse.json();
                
                // Call AuthContext login to save tokens and update state
                login('vendor', data.access, data.refresh);
                await SecureStore.setItemAsync('user_data', JSON.stringify(data.user));

                if (data.has_vendor_profile) {
                    router.replace('/(tabs)');
                } else {
                    router.replace('/(auth)/setup-profile');
                }
            } else {
                const error = await backendResponse.json();
                Alert.alert('Login Failed', error.error || 'Could not authenticate with Google');
            }
        } catch (err) {
            console.error('Google Sign-In error:', err);
            Alert.alert('Error', 'Network request failed. Please try again.');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleLogin = async () => {
        if (phone.length !== 10) {
            Alert.alert('Error', 'Please enter valid 10-digit number');
            return;
        }

        setLoading(true);
        try {
            // 1. Check if user exists
            const checkResponse = await fetch(`${API_URL}/users/check-user/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_number: phone })
            });
            const checkData = await checkResponse.json();

            if (!checkData.exists) {
                Alert.alert('Account not found', 'Redirecting to Registration...');
                router.push({ pathname: '/(auth)/signup', params: { phone } });
                setLoading(false);
                return;
            }

            // 2. If exists, Send OTP
            const response = await fetch(`${API_URL}/users/send-otp/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_number: phone })
            });

            const data = await response.json();
            if (response.ok) {
                if (data.otp) {
                    Alert.alert("Dev Mode OTP", `Your test OTP is: ${data.otp}\n(This is shown in dev mode so you don't need to check backend logs)`);
                }
                router.push({ pathname: '/(auth)/otp', params: { phone } });
            } else {
                Alert.alert('Error', data.error || 'Failed to send OTP');
            }
        } catch (err) {
            Alert.alert('Error', 'Network request failed');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#121212]">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 justify-center px-8"
            >
                <View className="items-center mb-10">
                    <View className="h-24 w-24 bg-white rounded-2xl items-center justify-center mb-4 shadow-lg shadow-blue-500/10 overflow-hidden">
                        <Image
                            source={require('@/assets/images/logo.png')}
                            className="w-full h-full"
                            resizeMode="contain"
                        />
                    </View>
                    <Text className="text-3xl font-bold text-gray-900 dark:text-white">
                        Vendor Portal
                    </Text>
                    <Text className="text-gray-500 mt-2 text-center dark:text-gray-400">
                        Manage your fleet and bookings
                    </Text>
                </View>

                <View className="space-y-4">
                    <View>
                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">
                            Mobile Number
                        </Text>
                        <TextInput
                            className="w-full bg-gray-50 dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
                            placeholder="9876543210"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={phone}
                            onChangeText={setPhone}
                        />
                    </View>

                    <TouchableOpacity
                        className="w-full bg-blue-600 py-4 rounded-xl shadow-lg shadow-blue-500/30 mt-4"
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text className="text-white text-center font-bold text-lg">
                            {loading ? "Sending OTP..." : "Continue"}
                        </Text>
                    </TouchableOpacity>

                    {/* OR Divider */}
                    <View className="flex-row items-center my-4">
                        <View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
                        <Text className="mx-4 text-gray-500 dark:text-gray-400">OR</Text>
                        <View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
                    </View>

                    {/* Google Sign-In Button */}
                    <TouchableOpacity
                        className="w-full bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 py-4 rounded-xl flex-row justify-center items-center"
                        onPress={() => promptAsync()}
                        disabled={!request || googleLoading}
                    >
                        {googleLoading ? (
                            <ActivityIndicator color="#4285F4" />
                        ) : (
                            <View className="flex-row items-center">
                                <Image
                                    source={{ uri: 'https://www.google.com/favicon.ico' }}
                                    className="w-5 h-5 mr-3"
                                    resizeMode="contain"
                                />
                                <Text className="text-gray-700 dark:text-gray-300 font-semibold">
                                    Continue with Google
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View className="flex-row justify-center mt-8">
                    <Text className="text-gray-500 dark:text-gray-400">
                        New to WheelGo?{' '}
                    </Text>
                    <Link href="/(auth)/signup" asChild>
                        <TouchableOpacity>
                            <Text className="text-blue-600 font-bold">Register Business</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

