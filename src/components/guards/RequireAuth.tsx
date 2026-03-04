import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

export const RequireAuth = () => {
    const { accessToken, user } = useAuthStore();
    const location = useLocation();

    if (!accessToken || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If the user requires onboarding and they try to go anywhere else, redirect them
    if (user.requiresOnboarding && location.pathname !== '/onboarding-setup') {
        return <Navigate to="/onboarding-setup" replace />;
    }

    return <Outlet />;
};
