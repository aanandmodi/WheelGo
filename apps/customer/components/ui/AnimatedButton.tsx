import React from 'react';
import { Pressable, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

interface AnimatedButtonProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'outline';
    className?: string; // For Tailwind classes on the container
    textClassName?: string;
    disabled?: boolean;
}

export default function AnimatedButton({
    onPress,
    title,
    variant = 'primary',
    className = '',
    textClassName = '',
    disabled = false
}: AnimatedButtonProps) {

    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            opacity: opacity.value,
        };
    });

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
        opacity.value = withTiming(0.8, { duration: 100 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
        opacity.value = withTiming(1, { duration: 100 });
    };

    const getVariantStyle = () => {
        if (disabled) return 'bg-gray-200';
        switch (variant) {
            case 'outline': return 'bg-transparent border border-primary';
            case 'secondary': return 'bg-secondary';
            default: return 'bg-primary';
        }
    };

    const getTextColor = () => {
        if (disabled) return 'text-gray-400';
        switch (variant) {
            case 'outline': return 'text-primary';
            default: return 'text-white';
        }
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            className="w-full"
        >
            <Animated.View className={`h-14 rounded-full items-center justify-center shadow-sm ${getVariantStyle()} ${className}`} style={animatedStyle}>
                <Text className={`font-bold text-base ${getTextColor()} ${textClassName}`}>
                    {title}
                </Text>
            </Animated.View>
        </Pressable>
    );
}
