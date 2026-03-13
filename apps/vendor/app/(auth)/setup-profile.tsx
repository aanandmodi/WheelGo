import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/constants/Api';

export default function SetupProfileScreen() {
    const router = useRouter();
    const { token, login } = useAuth();
    const [loading, setLoading] = useState(false);

    const [shopName, setShopName] = useState('');
    const [address, setAddress] = useState('');
    // const [ownerName, setOwnerName] = useState(''); // If we want to update User.full_name separately

    const handleSaveProfile = async () => {
        if (!shopName || !address) {
            Alert.alert("Missing Fields", "Please enter Shop Name and Address.");
            return;
        }

        setLoading(true);
        try {
            console.log("Creating profile with token:", token);
            const response = await fetch(`${API_URL}/vendors/profile/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    shop_name: shopName,
                    address: address,
                    // mock lat/lng
                    latitude: 12.9716,
                    longitude: 77.5946
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Profile Created
                Alert.alert("Success", "Profile Created Successfully!", [
                    { text: "Go to Dashboard", onPress: () => router.replace('/(tabs)') }
                ]);
            } else {
                Alert.alert("Error", JSON.stringify(data));
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Network Request Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#121212]">
            <View className="flex-1 p-6">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Complete Profile</Text>
                <Text className="text-gray-500 dark:text-gray-400 mb-8">Tell us about your rental business.</Text>

                <View className="space-y-4">
                    <View>
                        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shop Name</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-[#1E1E1E] p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white"
                            placeholder="e.g. WheelGo Rentals"
                            placeholderTextColor="gray"
                            value={shopName}
                            onChangeText={setShopName}
                        />
                    </View>

                    <View>
                        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-[#1E1E1E] p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white h-24"
                            placeholder="Full address of your shop"
                            placeholderTextColor="gray"
                            multiline
                            textAlignVertical="top"
                            value={address}
                            onChangeText={setAddress}
                        />
                    </View>
                </View>

                <View className="mt-8">
                    <TouchableOpacity
                        className={`bg-blue-600 py-4 rounded-xl shadow-lg shadow-blue-500/30 ${loading ? 'opacity-70' : ''}`}
                        onPress={handleSaveProfile}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white text-center font-bold text-lg">Save & Continue</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
