import { BlurView } from 'expo-blur';
import React from 'react';
import { View, ViewProps } from 'react-native';

interface GlassCardProps extends ViewProps {
    intensity?: number;
    className?: string;
}

export default function GlassCard({ children, intensity = 50, className = '', ...props }: GlassCardProps) {
    return (
        <View className={`rounded-3xl overflow-hidden shadow-lg bg-white/70 border border-white/20 ${className}`} {...props}>
            <BlurView intensity={intensity} tint="light" className="p-6">
                {children}
            </BlurView>
        </View>
    );
}
