import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

interface RequireOnboardingProps {
    children: React.ReactElement;
}

export const RequireOnboarding = ({ children }: RequireOnboardingProps) => {
    const { user, accessToken } = useAuthStore();
    const location = useLocation();

    // If not logged in, they can't onboard
    if (!accessToken || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If they are logged in but DO NOT require onboarding, send them to dashboard
    if (!user.requiresOnboarding) {
        return <Navigate to="/dashboard" replace />;
    }

    // They are logged in and require onboarding, allow access
    return children;
};
