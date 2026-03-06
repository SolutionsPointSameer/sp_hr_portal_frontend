import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

export const RequireAuth = () => {
    const { accessToken, user } = useAuthStore();
    const location = useLocation();

    if (!accessToken || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user.requiresOnboarding && !location.pathname.startsWith('/onboarding')) {
        return <Navigate to="/onboarding" replace />;
    }

    return <Outlet />;
};
