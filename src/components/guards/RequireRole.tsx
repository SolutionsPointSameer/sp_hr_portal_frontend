import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

interface RequireRoleProps {
    roles: ('EMPLOYEE' | 'MANAGER' | 'HR_ADMIN' | 'SUPER_ADMIN')[];
}

export const RequireRole = ({ roles }: RequireRoleProps) => {
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!roles.includes(user.role)) {
        return (
            <Result
                status="403"
                title="403 Forbidden"
                subTitle="Sorry, you are not authorized to access this page."
                extra={<Button type="primary" onClick={() => navigate('/dashboard')}>Back Home</Button>}
            />
        );
    }

    return <Outlet />;
};
