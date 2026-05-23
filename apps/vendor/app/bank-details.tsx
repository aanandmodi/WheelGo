import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { VendorApiService } from '@/constants/ApiService';

interface BankDetails {
    id?: number;
    account_holder_name: string;
    account_number: string;
    ifsc_code: string;
    bank_name: string;
    is_verified?: boolean;
}

export default function BankDetailsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasExisting, setHasExisting] = useState(false);
    const [form, setForm] = useState<BankDetails>({
        account_holder_name: '',
        account_number: '',
        ifsc_code: '',
        bank_name: ''
    });

    useFocusEffect(
        useCallback(() => {
            const fetchBankDetails = async () => {
                try {
                    const data = await VendorApiService.getBankDetails();
                    setForm(data);
                    setHasExisting(true);
                } catch (error) {
                    // No existing bank details
                } finally {
                    setLoading(false);
                }
            };

            if (token) fetchBankDetails();
        }, [token])
    );

    const handleSave = async () => {
        // Basic validation
        if (!form.account_holder_name || !form.account_number || !form.ifsc_code || !form.bank_name) {
            Alert.alert('Missing Fields', 'Please fill all fields');
            return;
        }

        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.ifsc_code)) {
            Alert.alert('Invalid IFSC', 'Please enter a valid IFSC code (e.g., SBIN0001234)');
            return;
        }

        setSaving(true);
        try {
            await VendorApiService.saveBankDetails(form);
            Alert.alert('Success', 'Bank details saved successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Failed to save bank details', error);
            Alert.alert('Error', error.message || 'Failed to save bank details');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-[#121212]">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1 px-4">
                    {/* Header */}
                    <View className="flex-row items-center py-4">
                        <TouchableOpacity onPress={() => router.back()} className="mr-3">
                            <FontAwesome name="arrow-left" size={20} color="#6B7280" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-gray-900 dark:text-white">Bank Details</Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#2563EB" className="mt-10" />
                    ) : (
                        <View className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                            {/* Info Banner */}
                            {form.is_verified && (
                                <View className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg mb-4 flex-row items-center">
                                    <FontAwesome name="check-circle" size={16} color="#16A34A" />
                                    <Text className="text-green-700 dark:text-green-400 ml-2 text-sm">Verified</Text>
                                </View>
                            )}

                            {/* Account Holder Name */}
                            <Text className="text-gray-500 text-sm mb-2">Account Holder Name</Text>
                            <TextInput
                                className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-lg text-gray-900 dark:text-white mb-4"
                                placeholder="As per bank records"
                                placeholderTextColor="#9CA3AF"
                                value={form.account_holder_name}
                                onChangeText={(text) => setForm(prev => ({ ...prev, account_holder_name: text }))}
                            />

                            {/* Account Number */}
                            <Text className="text-gray-500 text-sm mb-2">Account Number</Text>
                            <TextInput
                                className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-lg text-gray-900 dark:text-white mb-4"
                                placeholder="Enter account number"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                value={form.account_number}
                                onChangeText={(text) => setForm(prev => ({ ...prev, account_number: text }))}
                            />

                            {/* IFSC Code */}
                            <Text className="text-gray-500 text-sm mb-2">IFSC Code</Text>
                            <TextInput
                                className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-lg text-gray-900 dark:text-white mb-4"
                                placeholder="e.g., SBIN0001234"
                                placeholderTextColor="#9CA3AF"
                                autoCapitalize="characters"
                                value={form.ifsc_code}
                                onChangeText={(text) => setForm(prev => ({ ...prev, ifsc_code: text.toUpperCase() }))}
                            />

                            {/* Bank Name */}
                            <Text className="text-gray-500 text-sm mb-2">Bank Name</Text>
                            <TextInput
                                className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-lg text-gray-900 dark:text-white mb-6"
                                placeholder="e.g., State Bank of India"
                                placeholderTextColor="#9CA3AF"
                                value={form.bank_name}
                                onChangeText={(text) => setForm(prev => ({ ...prev, bank_name: text }))}
                            />

                            {/* Save Button */}
                            <TouchableOpacity
                                className="bg-blue-600 py-4 rounded-lg items-center"
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-base">
                                        {hasExisting ? 'Update Details' : 'Save Details'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
