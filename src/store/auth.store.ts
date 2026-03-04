import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
    id: string;
    role: 'EMPLOYEE' | 'MANAGER' | 'HR_ADMIN' | 'SUPER_ADMIN';
    firstName: string;
    lastName: string;
    email: string;
    employeeCode: string;
    requiresOnboarding?: boolean;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    login: (user: User, accessToken: string, refreshToken: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            login: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
            logout: () => set({ user: null, accessToken: null, refreshToken: null }),
        }),
        {
            name: 'hr-portal-auth', // localStorage key
            storage: createJSONStorage(() => localStorage),
        }
    )
);
