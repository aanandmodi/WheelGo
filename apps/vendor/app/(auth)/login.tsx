import { Link, router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    TouchableOpacity,
    View,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/constants/Api';

import Input from '@/components/ui/Input';
import GradientButton from '@/components/ui/GradientButton';
import Typography from '@/components/ui/Typography';
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
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 justify-center px-6"
            >
                <Animated.View entering={FadeInDown.duration(600).springify()} className="items-center mb-8">
                    <View className="h-24 w-24 bg-white rounded-2xl items-center justify-center mb-6 shadow-xl overflow-hidden">
                        <Image
                            source={require('@/assets/images/logo.png')}
                            className="w-full h-full"
                            resizeMode="contain"
                        />
                    </View>
                    <Typography variant="h1" className="text-center mb-2">Vendor Portal</Typography>
                    <Typography variant="body" className="text-center text-gray-500">Manage your fleet and bookings</Typography>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).duration(600).springify()}>
                    <View className="bg-white p-6 rounded-3xl border border-border shadow-sm mb-6">
                        <Typography variant="h3" className="mb-6 text-center text-gray-900">Welcome Back</Typography>

                        <Input
                            label="Mobile Number"
                            placeholder="98765 43210"
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={phone}
                            onChangeText={setPhone}
                            className="mb-2"
                        />

                        <GradientButton
                            title={loading ? "Sending OTP..." : "Continue"}
                            onPress={handleLogin}
                            disabled={phone.length !== 10 || loading}
                            className="mt-4"
                        />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).duration(600).springify()}>
                    {/* OR Divider */}
                    <View className="flex-row items-center my-6">
                        <View className="flex-1 h-px bg-gray-200" />
                        <Typography variant="caption" className="mx-4 text-gray-400">OR CONTINUE WITH</Typography>
                        <View className="flex-1 h-px bg-gray-200" />
                    </View>

                    {/* Google Sign-In Button */}
                    <TouchableOpacity
                        className="bg-white border border-gray-200 py-4 rounded-3xl flex-row justify-center items-center shadow-sm"
                        onPress={() => promptAsync()}
                        disabled={!request || googleLoading}
                    >
                        {googleLoading ? (
                            <ActivityIndicator color="#0F1115" />
                        ) : (
                            <View className="flex-row items-center">
                                <Image
                                    source={{ uri: 'https://www.google.com/favicon.ico' }}
                                    className="w-6 h-6 mr-3"
                                    resizeMode="contain"
                                />
                                <Typography variant="body" className="font-semibold text-gray-700">
                                    Continue with Google
                                </Typography>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View className="flex-row justify-center mt-8">
                        <Typography variant="body" className="text-gray-500">
                            New to WheelGo?{' '}
                        </Typography>
                        <Link href="/(auth)/signup" asChild>
                            <TouchableOpacity>
                                <Typography variant="body" className="text-primary font-bold">
                                    Register Business
                                </Typography>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

