import { router } from 'expo-router';
import React, { createContext, useContext, useState } from 'react';

type UserRole = 'consumer' | 'vendor' | null;

interface AuthContextType {
    userRole: UserRole;
    isLoggedIn: boolean;
    login: (role?: UserRole, token?: string, refresh?: string) => void;
    logout: () => void;
    switchRole: () => void;
}

const AuthContext = createContext<AuthContextType>({
    userRole: null,
    isLoggedIn: false,
    login: () => { },
    logout: () => { },
    switchRole: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const login = (role: UserRole = 'consumer', accessToken?: string, refreshToken?: string) => {
        setIsLoggedIn(true);
        setUserRole(role);
        if (accessToken) {
            // In a real app, verify calling SecureStore.setItemAsync('accessToken', accessToken);
            console.log("Logged in with token:", accessToken);
        }
    };

    const logout = () => {
        setIsLoggedIn(false);
        setUserRole(null);
        router.replace('/auth/login');
    };

    const switchRole = () => {
        // Feature disabled for now
        alert("Switch role not implemented in single app mode");
    };

    return (
        <AuthContext.Provider value={{ userRole, isLoggedIn, login, logout, switchRole }}>
            {children}
        </AuthContext.Provider>
    );
};
