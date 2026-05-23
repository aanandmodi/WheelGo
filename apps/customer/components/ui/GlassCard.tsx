import { BlurView } from 'expo-blur';
import React from 'react';
import { View, ViewProps } from 'react-native';

interface GlassCardProps extends ViewProps {
    intensity?: number;
    className?: string;
}

export default function GlassCard({ children, intensity = 50, className = '', ...props }: GlassCardProps) {
    return (
        <View className={`rounded-3xl overflow-hidden shadow-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-slate-800/40 ${className}`} {...props}>
            <BlurView intensity={intensity} tint="light" className="p-6 dark:hidden">
                {children}
            </BlurView>
            <BlurView intensity={intensity} tint="dark" className="p-6 hidden dark:flex">
                {children}
            </BlurView>
        </View>
    );
}
