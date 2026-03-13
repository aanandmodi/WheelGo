import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
    variant?: 'elevated' | 'outlined' | 'flat';
    className?: string;
}

export default function Card({ children, variant = 'elevated', className, ...props }: CardProps) {
    const variants = {
        elevated: "bg-white shadow-md border-0",
        outlined: "bg-white border border-gray-200 shadow-none",
        flat: "bg-gray-50 border-0 shadow-none"
    };

    return (
        <View className={`rounded-2xl p-4 ${variants[variant]} ${className}`} {...props}>
            {children}
        </View>
    );
}
