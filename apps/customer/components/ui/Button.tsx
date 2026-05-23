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

    const baseStyle = "rounded-3xl flex-row justify-center items-center shadow-sm active:opacity-90";

    const variants = {
        primary: "bg-primary border border-transparent shadow-md shadow-primary/20",
        secondary: "bg-secondary border border-transparent shadow-md shadow-secondary/15",
        outline: "bg-transparent border-2 border-gray-200 dark:border-gray-800",
        ghost: "bg-transparent border-0 shadow-none",
    };

    const sizes = {
        sm: "py-2.5 px-5",
        md: "py-3.5 px-6",
        lg: "py-4.5 px-8",
    };

    const textVariants = {
        primary: "text-white font-bold tracking-wide",
        secondary: "text-white font-bold tracking-wide",
        outline: "text-gray-700 dark:text-gray-300 font-bold",
        ghost: "text-primary font-bold",
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
                <Text className={`${textVariants[variant]} text-center text-base`}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}
