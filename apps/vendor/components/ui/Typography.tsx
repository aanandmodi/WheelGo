import React from 'react';
import { Text, TextProps } from 'react-native';

interface TypographyProps extends TextProps {
    variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
    color?: string;
    className?: string;
}

export default function Typography({ variant = 'body', color, className = '', children, ...props }: TypographyProps) {

    const styles = {
        h1: "text-4xl font-extrabold text-gray-900 tracking-tight",
        h2: "text-2xl font-bold text-gray-900",
        h3: "text-xl font-semibold text-gray-800",
        body: "text-base text-gray-600 leading-6",
        caption: "text-sm text-gray-500",
        label: "text-sm font-bold text-gray-700 uppercase tracking-wider",
    };

    const textColorClass = color ? `text-[${color}]` : '';

    return (
        <Text className={`${styles[variant]} ${textColorClass} ${className}`} {...props}>
            {children}
        </Text>
    );
}
