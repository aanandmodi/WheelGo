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
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1 px-6">
                    {/* Header */}
                    <View className="flex-row items-center py-6">
                        <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center bg-white rounded-full border border-gray-150 shadow-sm mr-4">
                            <FontAwesome name="arrow-left" size={16} color="#0F1115" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-gray-900">Bank Details</Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#0F1115" className="mt-10" />
                    ) : (
                        <View className="bg-white rounded-2xl p-6 border border-gray-150 shadow-sm">
                            {/* Info Banner */}
                            {form.is_verified && (
                                <View className="bg-emerald-50 border border-emerald-250 p-4 rounded-xl mb-6 flex-row items-center">
                                    <FontAwesome name="check-circle" size={18} color="#10B981" />
                                    <Text className="text-emerald-800 ml-3 font-semibold text-sm">Account Verified</Text>
                                </View>
                            )}

                            {/* Account Holder Name */}
                            <View className="mb-4">
                                <Text className="text-sm font-medium text-gray-750 mb-2">Account Holder Name</Text>
                                <TextInput
                                    className="bg-white p-4 rounded-xl border border-gray-200 text-gray-900"
                                    placeholder="As per bank records"
                                    placeholderTextColor="gray"
                                    value={form.account_holder_name}
                                    onChangeText={(text) => setForm(prev => ({ ...prev, account_holder_name: text }))}
                                />
                            </View>

                            {/* Account Number */}
                            <View className="mb-4">
                                <Text className="text-sm font-medium text-gray-750 mb-2">Account Number</Text>
                                <TextInput
                                    className="bg-white p-4 rounded-xl border border-gray-200 text-gray-900"
                                    placeholder="Enter account number"
                                    placeholderTextColor="gray"
                                    keyboardType="numeric"
                                    value={form.account_number}
                                    onChangeText={(text) => setForm(prev => ({ ...prev, account_number: text }))}
                                />
                            </View>

                            {/* IFSC Code */}
                            <View className="mb-4">
                                <Text className="text-sm font-medium text-gray-750 mb-2">IFSC Code</Text>
                                <TextInput
                                    className="bg-white p-4 rounded-xl border border-gray-200 text-gray-900"
                                    placeholder="e.g., SBIN0001234"
                                    placeholderTextColor="gray"
                                    autoCapitalize="characters"
                                    value={form.ifsc_code}
                                    onChangeText={(text) => setForm(prev => ({ ...prev, ifsc_code: text.toUpperCase() }))}
                                />
                            </View>

                            {/* Bank Name */}
                            <View className="mb-8">
                                <Text className="text-sm font-medium text-gray-750 mb-2">Bank Name</Text>
                                <TextInput
                                    className="bg-white p-4 rounded-xl border border-gray-200 text-gray-900"
                                    placeholder="e.g., State Bank of India"
                                    placeholderTextColor="gray"
                                    value={form.bank_name}
                                    onChangeText={(text) => setForm(prev => ({ ...prev, bank_name: text }))}
                                />
                            </View>

                            {/* Save Button */}
                            <TouchableOpacity
                                className={`bg-primary py-4 rounded-full shadow-lg shadow-gray-950/15 items-center ${saving ? 'opacity-70' : ''}`}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">
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
