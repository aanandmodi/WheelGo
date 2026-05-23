import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
    variant?: 'elevated' | 'outlined' | 'flat';
    className?: string;
}

export default function Card({ children, variant = 'elevated', className, ...props }: CardProps) {
    const variants = {
        elevated: "bg-white dark:bg-[#1E293B] shadow-lg shadow-slate-100 dark:shadow-none border border-gray-100/50 dark:border-slate-800",
        outlined: "bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-slate-800 shadow-none",
        flat: "bg-gray-50 dark:bg-slate-800/40 border border-transparent shadow-none"
    };

    return (
        <View className={`rounded-3xl p-5 ${variants[variant]} ${className}`} {...props}>
            {children}
        </View>
    );
}
