import { useState } from 'react';
import { Layout, Menu, Button, Dropdown, Tooltip } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    DashboardOutlined,
    TeamOutlined,
    CalendarOutlined,
    FileDoneOutlined,
    SettingOutlined,
    UserOutlined,
    LogoutOutlined,
    BarChartOutlined,
    BellOutlined,
    DollarOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

export const AppLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const userMenuItems: MenuProps['items'] = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'My Profile',
            onClick: () => navigate(`/employees/${user?.id}`),
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            onClick: handleLogout,
            danger: true,
        },
    ];

    const getMenuItems = () => {
        const items: MenuProps['items'] = [
            {
                key: '/dashboard',
                icon: <DashboardOutlined />,
                label: 'Dashboard',
            },
        ];

        if (user?.role && ['HR_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            items.push({
                key: 'employees-group',
                icon: <TeamOutlined />,
                label: 'Employees',
                children: [
                    { key: '/employees', label: 'Employee List' },
                    { key: '/employees/org-chart', label: 'Org Chart' },
                ],
            });
        }

        items.push({
            key: 'attendance',
            icon: <CalendarOutlined />,
            label: 'Attendance',
            children: [
                { key: '/attendance/mine', label: 'My Attendance' },
                ...(user?.role && ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(user.role)
                    ? [{ key: '/attendance/team', label: 'Team Attendance' }]
                    : []),
            ],
        });

        items.push({
            key: 'leave',
            icon: <FileDoneOutlined />,
            label: 'Leave',
            children: [
                { key: '/leave/mine', label: 'My Leave' },
                { key: '/leave/calendar', label: 'Leave Calendar' },
                ...(user?.role && ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(user.role)
                    ? [
                        { key: '/leave/team', label: 'Team Leaves' },
                        { key: '/leave/approvals', label: 'Pending Approvals' }
                    ]
                    : []),
            ],
        });

        // Special items for Admins
        if (user?.role && ['HR_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            items.push({
                key: '/payroll',
                icon: <DollarOutlined />,
                label: 'Payroll',
            });
            items.push({
                key: '/reports',
                icon: <BarChartOutlined />,
                label: 'Reports',
            });
        }

        if (user?.role === 'SUPER_ADMIN') {
            items.push({
                key: 'admin',
                icon: <SettingOutlined />,
                label: 'Admin',
                children: [
                    { key: '/admin/master-data', label: 'Master Data' },
                    { key: '/admin/holidays', label: 'Manage Holidays' },
                    { key: '/admin/leave-types', label: 'Leave Types' },
                    { key: '/admin/users', label: 'User Management' },
                    { key: '/admin/settings', label: 'System Settings' },
                ],
            });
        }

        return items;
    };

    // Find the selected key based on the current location
    const getSelectedKeys = () => {
        const path = location.pathname;
        if (path === '/employees/org-chart') return ['/employees/org-chart'];
        if (path.startsWith('/employees')) return ['/employees'];
        return [path];
    };

    const getOpenKeys = () => {
        const path = location.pathname;
        if (path.startsWith('/employees')) return ['employees-group'];
        if (path.startsWith('/attendance')) return ['attendance'];
        if (path.startsWith('/leave')) return ['leave'];
        if (path.startsWith('/admin')) return ['admin'];
        return [];
    };

    const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase() || 'U';

    return (
        <Layout className="min-h-screen" style={{ background: '#f3f4f8' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={260}
                collapsedWidth={80}
                breakpoint="lg"
                onBreakpoint={(broken) => {
                    if (broken) setCollapsed(true);
                }}
                className="app-sider !bg-white border-r border-slate-200/80 z-20"
                style={{
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    boxShadow: '2px 0 16px rgba(0, 0, 0, 0.03)',
                }}
            >
                {/* Logo */}
                <div
                    className="flex items-center justify-center border-b border-slate-100"
                    style={{ height: 64, padding: collapsed ? '0 8px' : '0 20px' }}
                >
                    {collapsed ? (
                        <img src="/assets/LOGO.png" alt="SP" className="w-10 h-10 object-contain" />
                    ) : (
                        <div className="flex items-center gap-3 w-full">
                            <img src="/assets/LOGO.png" alt="Solutions Point" className="w-9 h-9 object-contain flex-shrink-0" />
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold tracking-tight leading-tight" style={{ color: '#26428b' }}>Solutions Point</span>
                                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">HR Portal</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-3">
                    <Menu
                        mode="inline"
                        selectedKeys={getSelectedKeys()}
                        defaultOpenKeys={getOpenKeys()}
                        items={getMenuItems()}
                        onClick={({ key }) => navigate(key)}
                        className="border-none !bg-transparent"
                        style={{ borderRight: 0 }}
                    />
                </div>

                {/* User card at bottom */}
                {!collapsed && (
                    <div className="p-4 border-t border-slate-100 animate-fade-in">
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#e00c05]/30 hover:bg-red-50/30 transition-all cursor-pointer group shadow-sm hover:shadow-md" onClick={() => navigate(`/employees/${user?.id}`)}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0 transition-all group-hover:scale-105"
                                style={{ background: 'linear-gradient(135deg, #e00c05 0%, #ff4d4f 100%)', boxShadow: '0 4px 12px rgba(224, 12, 5, 0.2)' }}>
                                {user?.firstName?.charAt(0) || 'U'}
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-bold text-slate-800 truncate leading-tight group-hover:text-[#e00c05] transition-colors">{user?.firstName} {user?.lastName}</div>
                                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{user?.role?.replace('_', ' ')?.toLowerCase()}</div>
                            </div>
                        </div>
                    </div>
                )}
            </Sider>

            <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'margin-left 0.3s cubic-bezier(0.22, 1, 0.36, 1)' }}>
                {/* Header */}
                <Header
                    className="flex items-center justify-between border-b border-slate-200/60 sticky top-0 z-10"
                    style={{
                        background: 'rgba(255, 255, 255, 0.88)',
                        backdropFilter: 'blur(12px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                        height: 64,
                        lineHeight: '64px',
                        padding: '0 28px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    }}
                >
                    <div className="flex items-center gap-4">
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 w-9 h-9 flex items-center justify-center rounded-lg"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <Tooltip title="Notifications">
                            <Button
                                type="text"
                                icon={<BellOutlined className="text-lg" />}
                                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 w-9 h-9 flex items-center justify-center rounded-lg"
                            />
                        </Tooltip>

                        <div className="w-px h-6 bg-slate-200 mx-1"></div>

                        <span className="hidden sm:inline-block text-slate-700 text-[13px] font-bold tracking-tight mr-1">
                            {user?.firstName} {user?.lastName}
                        </span>
                        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow={{ pointAtCenter: true }}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white cursor-pointer select-none font-bold text-xs shadow-md transition-all hover:shadow-lg active:scale-95" 
                                style={{ background: 'linear-gradient(135deg, #e00c05 0%, #ff4d4f 100%)', boxShadow: '0 4px 12px rgba(224, 12, 5, 0.2)' }}>
                                {initials}
                            </div>
                        </Dropdown>
                    </div>
                </Header>

                {/* Content */}
                <Content
                    className="overflow-auto"
                    style={{ padding: '28px 32px', minHeight: 'calc(100vh - 64px)' }}
                >
                    <div className="mx-auto max-w-[1400px] animate-fade-in">
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};
