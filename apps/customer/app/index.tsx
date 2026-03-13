import { Redirect } from 'expo-router';
import React from 'react';

export default function Index() {
    // Logic: Check if user is logged in or completed onboarding
    // For now, force onboarding
    return <Redirect href="/auth/login" />;
}
