import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Image, SafeAreaView, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { submitReview } from '@/constants/ApiService';

export default function FeedbackScreen() {
    const { bookingId, bikeId } = useLocalSearchParams<{ bookingId?: string; bikeId?: string }>();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const getRatingText = () => {
        switch (rating) {
            case 5: return 'Excellent!';
            case 4: return 'Very Good!';
            case 3: return 'Good';
            case 2: return 'Fair';
            case 1: return 'Poor';
            default: return '';
        }
    };

    const handleSubmitReview = async () => {
        if (!bookingId) {
            Alert.alert('Error', 'No booking specified for review');
            router.push('/(tabs)');
            return;
        }

        try {
            setSubmitting(true);
            await submitReview(parseInt(bookingId), rating, comment);
            Alert.alert(
                'Thank You!',
                'Your review has been submitted successfully.',
                [{ text: 'OK', onPress: () => router.push('/(tabs)') }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkip = () => {
        router.push('/(tabs)');
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#102220]">
            <View className="flex-1 px-4">
                {/* Header */}
                <View className="flex-row items-center justify-between py-4">
                    <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center">
                        <MaterialIcons name="close" size={24} color="#1C1917" />
                    </TouchableOpacity>
                    <Text className="text-lg font-semibold text-[#1C1917] dark:text-white">Rate Your Ride</Text>
                    <View className="w-10" />
                </View>

                <View className="flex-1">
                    {/* Card */}
                    <View className="p-4 bg-[#F5F8F8] dark:bg-[#2D3748] rounded-lg flex-row items-center gap-4 mb-8">
                        <View className="flex-1 gap-1">
                            <Text className="text-[#1C1917] dark:text-white text-base font-semibold">
                                How was your experience?
                            </Text>
                            <Text className="text-[#718096] dark:text-gray-400 text-sm">
                                Your feedback helps us improve
                            </Text>
                        </View>
                        <View className="h-12 w-12 bg-primary/10 rounded-full items-center justify-center">
                            <MaterialIcons name="two-wheeler" size={24} color="#0F766E" />
                        </View>
                    </View>

                    <Text className="text-2xl font-semibold text-center text-[#1C1917] dark:text-white mb-4">
                        Tap to rate
                    </Text>

                    {/* Stars */}
                    <View className="flex-row justify-center gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                <MaterialIcons
                                    name={star <= rating ? "star" : "star-border"}
                                    size={48}
                                    color={star <= rating ? "#F9A825" : "#D6D3D1"}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text className="text-base font-medium text-center text-[#1C1917] dark:text-white mb-8">
                        {getRatingText()}
                    </Text>

                    <View className="flex-1">
                        <Text className="text-[#1C1917] dark:text-white text-sm font-medium mb-2">
                            Add a comment (optional)
                        </Text>
                        <TextInput
                            className="w-full rounded-lg border border-[#D6D3D1] dark:border-[#2D3748] bg-[#F5F8F8] dark:bg-[#2D3748] p-4 text-[#1C1917] dark:text-white text-base h-32"
                            placeholder="Tell us more about your experience..."
                            placeholderTextColor="#718096"
                            multiline
                            textAlignVertical="top"
                            value={comment}
                            onChangeText={setComment}
                        />
                    </View>

                </View>

                {/* Footer */}
                <View className="pb-6 pt-2">
                    <TouchableOpacity
                        onPress={handleSubmitReview}
                        disabled={submitting}
                        className={`w-full py-4 rounded-full items-center mb-4 ${submitting ? 'bg-gray-400' : 'bg-[#00897B]'}`}
                    >
                        {submitting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-semibold text-base">Submit Feedback</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSkip} className="w-full items-center py-2">
                        <Text className="text-[#00897B] font-semibold text-base">Skip</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </SafeAreaView>
    );
}
