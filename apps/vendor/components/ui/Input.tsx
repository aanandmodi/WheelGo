import React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    className?: string;
    containerStyle?: string;
}

export default function Input({ label, error, className, containerStyle = '', ...props }: InputProps) {
    return (
        <View className={`mb-5 ${containerStyle}`}>
            {label && <Text className="text-gray-700 dark:text-gray-300 mb-2 font-bold text-xs tracking-wider uppercase">{label}</Text>}
            <View className={`bg-gray-50 dark:bg-slate-800/40 rounded-3xl border-2 ${error ? 'border-red-400 bg-red-50 dark:bg-red-950/10' : 'border-gray-200 dark:border-slate-800'} focus-within:border-primary transition-all overflow-hidden`}>
                <TextInput
                    className={`p-4 text-base text-gray-900 dark:text-white placeholder:text-gray-400 ${className}`}
                    placeholderTextColor="#64748B"
                    selectionColor="#EA580C"
                    {...props}
                />
            </View>
            {error && <Text className="text-red-500 text-xs mt-1.5 ml-2 font-semibold">{error}</Text>}
        </View>
    );
}
