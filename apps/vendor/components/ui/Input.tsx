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
            {label && <Text className="text-gray-700 mb-2 font-semibold text-sm tracking-wide">{label}</Text>}
            <View className={`bg-gray-50 rounded-2xl border ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:border-primary-light focus:bg-white transition-all overflow-hidden`}>
                <TextInput
                    className={`p-4 text-base text-gray-900 placeholder:text-gray-400 ${className}`}
                    placeholderTextColor="#94A3B8"
                    selectionColor="#2563EB"
                    {...props}
                />
            </View>
            {error && <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>}
        </View>
    );
}
