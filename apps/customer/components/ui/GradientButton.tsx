import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface GradientButtonProps extends TouchableOpacityProps {
    title: string;
    onPress: () => void;
    colors?: [string, string, ...string[]];
    isLoading?: boolean;
    variant?: 'primary' | 'secondary';
    className?: string;
}

export default function GradientButton({
    title,
    onPress,
    colors,
    isLoading = false,
    variant = 'primary',
    className = '',
    ...props
}: GradientButtonProps) {

    // Default gradients
    const gradients: Record<string, [string, string]> = {
        primary: ['#FF7A00', '#EA580C'], // Vibrant Orange
        secondary: ['#1E293B', '#0F172A'], // Deep Navy / Slate
    };

    const activeGradient = colors || gradients[variant];

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            disabled={isLoading || props.disabled}
            className={`rounded-3xl shadow-lg shadow-orange-500/20 ${props.disabled ? 'opacity-50' : ''} ${className}`}
            {...props}
        >
            <LinearGradient
                colors={activeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-4 px-8 rounded-3xl items-center justify-center"
            >
                {isLoading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white font-bold text-base tracking-wider uppercase">{title}</Text>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
}
