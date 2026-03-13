import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
}

export default function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    className = ''
}: ButtonProps) {

    const baseStyle = "rounded-2xl flex-row justify-center items-center shadow-sm";

    const variants = {
        primary: "bg-primary border border-transparent",
        secondary: "bg-secondary border border-secondary",
        outline: "bg-transparent border border-gray-300",
        ghost: "bg-transparent border-0 shadow-none",
    };

    const sizes = {
        sm: "py-2 px-4",
        md: "py-3 px-6",
        lg: "py-4 px-8",
    };

    const textVariants = {
        primary: "text-white font-bold",
        secondary: "text-black font-bold",
        outline: "text-gray-700 font-medium",
        ghost: "text-primary font-medium",
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || isLoading}
            className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50' : ''} ${className}`}
        >
            {isLoading ? (
                <ActivityIndicator color={variant === 'outline' ? 'gray' : 'white'} />
            ) : (
                <Text className={`${textVariants[variant]} text-center text-lg`}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}
