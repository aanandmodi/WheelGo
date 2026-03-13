import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, TouchableOpacity, View, Image, ActivityIndicator, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';

import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import { API_URL } from '@/constants/Api';
import { useAuth } from '@/context/AuthContext';

// Complete any pending auth sessions
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const [phone, setPhone] = useState('9876543210');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const { login } = useAuth();

    // Google OAuth configuration
    // Web client ID from google-services.json
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

            // Send to our backend for authentication
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
                // Save tokens and user data
                await AsyncStorage.setItem('access_token', data.access);
                await AsyncStorage.setItem('refresh_token', data.refresh);
                await AsyncStorage.setItem('user', JSON.stringify(data.user));

                // Update auth context
                login(data.access, data.user);

                if (data.new_user) {
                    // New user - go to profile setup
                    router.replace('/(tabs)');
                } else {
                    // Existing user - go to home
                    router.replace('/(tabs)');
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

    const handlePhoneLogin = async () => {
        if (phone.length === 10) {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/users/send-otp/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone_number: phone })
                });

                if (response.ok) {
                    router.push({ pathname: '/auth/otp', params: { phone } });
                } else {
                    const error = await response.json();
                    Alert.alert('Error', error.error || "Failed to send OTP");
                }
            } catch (err) {
                Alert.alert('Error', "Network request failed");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <View className="flex-1">
            {/* Background Gradient */}
            <LinearGradient
                colors={['#0F766E', '#F8FAFC', '#FFFFFF']}
                locations={[0, 0.4, 1]}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '100%' }}
            />

            <SafeAreaView className="flex-1">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-center px-6">

                    <Animated.View entering={FadeInDown.duration(600).springify()} className="mb-8 items-center">
                        <View className="w-24 h-24 bg-white rounded-2xl justify-center items-center shadow-xl mb-6 overflow-hidden">
                            <Image
                                source={require('@/assets/images/logo.png')}
                                className="w-full h-full"
                                resizeMode="contain"
                            />
                        </View>
                        <Typography variant="h1" className="text-center mb-2">WheelGo</Typography>
                        <Typography variant="body" className="text-center text-gray-500">Eco-friendly rides at your fingertips</Typography>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(200).duration(600).springify()}>
                        <GlassCard intensity={80} className="mb-6">
                            <Typography variant="h3" className="mb-6 text-center">Welcome Back</Typography>

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
                                onPress={handlePhoneLogin}
                                disabled={phone.length !== 10 || loading}
                                className="mt-4"
                            />
                        </GlassCard>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400).duration(600).springify()}>
                        <View className="flex-row items-center my-6">
                            <View className="flex-1 h-px bg-gray-300" />
                            <Typography variant="caption" className="mx-4">OR CONTINUE WITH</Typography>
                            <View className="flex-1 h-px bg-gray-300" />
                        </View>

                        <TouchableOpacity
                            className="bg-white border border-gray-200 py-4 rounded-2xl flex-row justify-center items-center shadow-sm"
                            onPress={() => promptAsync()}
                            disabled={!request || googleLoading}
                        >
                            {googleLoading ? (
                                <ActivityIndicator color="#4285F4" />
                            ) : (
                                <View className="flex-row items-center">
                                    {/* Google Logo */}
                                    <View className="w-6 h-6 mr-3">
                                        <Image
                                            source={{ uri: 'https://www.google.com/favicon.ico' }}
                                            className="w-full h-full"
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <Typography variant="body" className="font-semibold text-gray-700">
                                        Continue with Google
                                    </Typography>
                                </View>
                            )}
                        </TouchableOpacity>
                    </Animated.View>

                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

