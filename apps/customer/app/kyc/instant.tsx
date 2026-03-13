import AnimatedButton from '@/components/ui/AnimatedButton';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InstantKYCScreen() {
    const [uploads, setUploads] = useState({
        aadhaar: false,
        license: false,
        selfie: false,
    });

    const pickDocument = async (type: keyof typeof uploads) => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setUploads(prev => ({ ...prev, [type]: true }));
            Alert.alert("Success", `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom', 'left', 'right']}>
            <View className="flex-1 px-6 pt-6">

                <Animated.View entering={FadeInDown.duration(600)} className="mb-8">
                    <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 bg-gray-50 rounded-full items-center justify-center mb-6">
                        <MaterialIcons name="arrow-back" size={24} color="#111817" />
                    </TouchableOpacity>
                    <Text className="text-3xl font-bold text-[#111817]">Instant KYC</Text>
                    <Text className="text-gray-500 mt-2 text-base">Verify your identity in seconds to start riding.</Text>
                </Animated.View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

                    <Animated.View entering={FadeInDown.delay(200).duration(600)} className="gap-4 mb-8">
                        {/* Aadhaar Card */}
                        <TouchableOpacity onPress={() => pickDocument('aadhaar')} className={`border ${uploads.aadhaar ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'} rounded-2xl p-4 flex-row items-center gap-4`}>
                            <View className={`h-12 w-12 ${uploads.aadhaar ? 'bg-green-100' : 'bg-orange-100'} rounded-full items-center justify-center`}>
                                {uploads.aadhaar ? <MaterialIcons name="check" size={24} color="green" /> : <Text className="text-2xl">🆔</Text>}
                            </View>
                            <View className="flex-1">
                                <Text className="text-[#111817] font-bold text-lg">Aadhaar Card</Text>
                                <Text className="text-gray-500 text-sm">{uploads.aadhaar ? 'Uploaded' : 'Verify via DigiLocker OTP'}</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={uploads.aadhaar ? "green" : "#9CA3AF"} />
                        </TouchableOpacity>

                        {/* Driving License */}
                        <TouchableOpacity onPress={() => pickDocument('license')} className={`border ${uploads.license ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'} rounded-2xl p-4 flex-row items-center gap-4`}>
                            <View className={`h-12 w-12 ${uploads.license ? 'bg-green-100' : 'bg-blue-100'} rounded-full items-center justify-center`}>
                                {uploads.license ? <MaterialIcons name="check" size={24} color="green" /> : <Text className="text-2xl">🚗</Text>}
                            </View>
                            <View className="flex-1">
                                <Text className="text-[#111817] font-bold text-lg">Driving License</Text>
                                <Text className="text-gray-500 text-sm">{uploads.license ? 'Uploaded' : 'Required for riding eligibility'}</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={uploads.license ? "green" : "#9CA3AF"} />
                        </TouchableOpacity>

                        {/* Selfie */}
                        <TouchableOpacity onPress={() => pickDocument('selfie')} className={`border ${uploads.selfie ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'} rounded-2xl p-4 flex-row items-center gap-4`}>
                            <View className={`h-12 w-12 ${uploads.selfie ? 'bg-green-100' : 'bg-green-100'} rounded-full items-center justify-center`}>
                                {uploads.selfie ? <MaterialIcons name="check" size={24} color="green" /> : <Text className="text-xl">📸</Text>}
                            </View>
                            <View className="flex-1">
                                <Text className="text-[#111817] font-bold text-lg">Selfie Verification</Text>
                                <Text className="text-gray-500 text-sm">{uploads.selfie ? 'Uploaded' : 'To match with your ID'}</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={uploads.selfie ? "green" : "#9CA3AF"} />
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400).duration(600)} className="bg-blue-50 p-4 rounded-xl flex-row gap-3 mb-8">
                        <MaterialIcons name="security" size={24} color="#2563EB" />
                        <Text className="text-blue-800 text-sm flex-1 leading-5">
                            Your data is 100% secure and used only for verification purposes as per government guidelines.
                        </Text>
                    </Animated.View>

                </ScrollView>

                <Animated.View entering={FadeInDown.delay(600).duration(600)} className="pb-8 pt-4 border-t border-gray-100">
                    <AnimatedButton
                        title="Continue to DigiLocker"
                        onPress={() => router.push('/kyc/digilocker')}
                    />
                    <TouchableOpacity onPress={() => router.replace('/(tabs)')} className="mt-4 items-center">
                        <Text className="text-gray-500 font-medium text-sm">Skip for now</Text>
                    </TouchableOpacity>
                </Animated.View>

            </View>
        </SafeAreaView>
    );
}
