import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

export default function SignupScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleSignup = () => {
        // Navigate to Home (Tabs)
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView className="flex-1 bg-white p-6">
            <Text className="text-xl font-bold mb-6 mt-4">Create your profile</Text>

            <View className="items-center mb-8">
                <TouchableOpacity className="w-24 h-24 bg-gray-100 rounded-full justify-center items-center border border-gray-200">
                    <Text className="text-4xl text-gray-400">📷</Text>
                </TouchableOpacity>
                <Text className="text-primary mt-2 font-medium">Upload Photo</Text>
            </View>

            <Input label="Full Name" placeholder="John Doe" value={name} onChangeText={setName} />
            <Input label="Email Address" placeholder="john@example.com" keyboardType="email-address" value={email} onChangeText={setEmail} />

            <View className="flex-1 justify-end mb-4">
                <Button title="Create Account" onPress={handleSignup} />
            </View>
        </SafeAreaView>
    );
}
