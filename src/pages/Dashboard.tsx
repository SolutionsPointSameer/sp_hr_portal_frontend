import { Typography, Row, Col, Card, Spin, List, Tag, Table } from 'antd';
import { TeamOutlined, RiseOutlined, FileDoneOutlined, ClockCircleOutlined, UserAddOutlined, CalendarOutlined, ArrowRightOutlined, DollarCircleOutlined, WalletOutlined, BankOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

// Stat card color presets
const statStyles = {
    red: { border: '#E00C05', bg: 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)', icon: '#E00C05', shadow: 'rgba(224,12,5,0.08)' },
    blue: { border: '#3b82f6', bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', icon: '#3b82f6', shadow: 'rgba(59,130,246,0.08)' },
    amber: { border: '#f59e0b', bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', icon: '#f59e0b', shadow: 'rgba(245,158,11,0.08)' },
    green: { border: '#10b981', bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', icon: '#10b981', shadow: 'rgba(16,185,129,0.08)' },
};

function StatCard({ title, value, icon, color, suffix, loading }: { title: string; value: number | string; icon: React.ReactNode; color: keyof typeof statStyles; suffix?: string; loading?: boolean }) {
    const s = statStyles[color];
    return (
        <Card
            bordered={false}
            className="stat-card h-full cursor-default"
            style={{
                borderRadius: 16,
                background: s.bg,
                border: 'none',
                boxShadow: `0 1px 3px ${s.shadow}`,
            }}
        >
            <Spin spinning={!!loading}>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="text-slate-500 font-medium text-sm mb-2">{title}</div>
                        <div className="text-3xl font-bold text-slate-900 tracking-tight">
                            {value}{suffix && <span className="text-base font-medium text-slate-500 ml-1">{suffix}</span>}
                        </div>
                    </div>
                    <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: 'rgba(255,255,255,0.7)', color: s.icon, boxShadow: `0 2px 8px ${s.shadow}` }}
                    >
                        {icon}
                    </div>
                </div>
            </Spin>
        </Card>
    );
}

export default function Dashboard() {
    const user = useAuthStore(state => state.user);
    const navigate = useNavigate();
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
        queryKey: ['employees', 'dashboard'],
        queryFn: async () => {
            const res = await apiClient.get('/employees?limit=1');
            return res.data;
        },
        enabled: user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN',
    });

    const { data: pendingApprovals, isLoading: isLoadingApprovals } = useQuery({
        queryKey: ['leave', 'pending-approvals'],
        queryFn: async () => {
            const res = await apiClient.get('/leave/pending-approvals');
            return res.data;
        },
        enabled: user?.role !== 'EMPLOYEE',
    });

    const { data: leaveBalances, isLoading: isLoadingBalances } = useQuery({
        queryKey: ['leave', 'my-balances'],
        queryFn: async () => {
            const res = await apiClient.get('/leave/my-balances');
            return res.data;
        },
    });

    const totalEmployees = employeesData?.meta?.total || 0;
    const pendingCount = pendingApprovals?.length || 0;
    const availableLeave = leaveBalances?.reduce((acc: number, curr: any) => acc + curr.remaining, 0) || 0;
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

    const { data: salaryMetrics, isLoading: isLoadingSalaryMetrics } = useQuery({
        queryKey: ['reports', 'salary-metrics', 'dashboard'],
        queryFn: async () => {
            const res = await apiClient.get('/reports/salary-metrics');
            return res.data;
        },
        enabled: isSuperAdmin,
    });

    const { data: onLeaveData } = useQuery({
        queryKey: ['employees', 'on-leave-count'],
        queryFn: async () => {
            const res = await apiClient.get('/employees?limit=1&status=ON_LEAVE');
            return res.data?.meta?.total || 0;
        },
        enabled: isAdmin,
    });

    const { data: recentLeaves = [] } = useQuery({
        queryKey: ['leave', 'mine', 'recent'],
        queryFn: async () => {
            const res = await apiClient.get('/leave/mine');
            return (res.data || []).slice(0, 5);
        },
        retry: false,
    });

    const { data: recentEmployeesData } = useQuery({
        queryKey: ['employees', 'recent'],
        queryFn: async () => {
            const res = await apiClient.get('/employees?limit=5&sortBy=createdAt&order=desc');
            return res.data?.data || [];
        },
        enabled: isAdmin,
    });

    const activityFeed = [
        ...((recentLeaves as any[]).map((leave: any) => ({
            key: `leave-${leave.id}`,
            time: leave.createdAt,
            icon: <CalendarOutlined className="text-amber-500" />,
            title: `Leave request – ${leave.leaveType?.name || 'Leave'}`,
            description: `${dayjs(leave.fromDate).format('DD MMM')} → ${dayjs(leave.toDate).format('DD MMM')}`,
            tag: leave.status,
            tagColor: leave.status === 'APPROVED' ? 'success' : leave.status === 'PENDING' ? 'warning' : 'error',
        }))),
        ...((isAdmin && recentEmployeesData ? recentEmployeesData as any[] : []).map((emp: any) => ({
            key: `emp-${emp.id}`,
            time: emp.createdAt,
            icon: <UserAddOutlined className="text-green-500" />,
            title: `New employee joined`,
            description: `${emp.firstName} ${emp.lastName} – ${emp.designation?.name || emp.role}`,
            tag: null,
            tagColor: null,
        }))),
    ]
        .filter(a => a.time)
        .sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf())
        .slice(0, 8);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount || 0);

    const financialRows = Object.entries(salaryMetrics?.byDepartment || {})
        .map(([department, values]: [string, any]) => ({
            department,
            headcount: values.headcount,
            totalCtc: values.totalCtc * 12,
            totalInHand: values.totalInHand,
            avgCtc: values.headcount ? (values.totalCtc * 12) / values.headcount : 0,
        }))
        .sort((a, b) => b.totalCtc - a.totalCtc)
        .slice(0, 5);

    const financialColumns = [
        {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
            render: (value: string) => <span className="font-semibold text-slate-800">{value}</span>,
        },
        {
            title: 'Headcount',
            dataIndex: 'headcount',
            key: 'headcount',
        },
        {
            title: 'Annual CTC',
            dataIndex: 'totalCtc',
            key: 'totalCtc',
            render: (value: number) => <span className="font-mono text-slate-700">{formatCurrency(value)}</span>,
        },
        {
            title: 'Monthly In-Hand',
            dataIndex: 'totalInHand',
            key: 'totalInHand',
            render: (value: number) => <span className="font-mono text-green-700">{formatCurrency(value)}</span>,
        },
    ];

    // Greeting based on time of day
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="flex flex-col gap-7">
            {/* Header */}
            <div>
                <Title level={2} className="!mb-1 page-heading" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {greeting}, {user?.firstName} 👋
                </Title>
                <Text className="text-slate-500 text-base">Here's what's happening across your organization today.</Text>
            </div>

            {/* Stat Cards */}
            <Row gutter={[20, 20]}>
                {isAdmin && (
                    <>
                        <Col xs={24} sm={12} lg={6}>
                            <StatCard
                                title="Total Employees"
                                value={totalEmployees}
                                icon={<TeamOutlined />}
                                color="red"
                                loading={isLoadingEmployees}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <StatCard
                                title="On Leave Today"
                                value={onLeaveData ?? 0}
                                icon={<RiseOutlined />}
                                color="blue"
                                loading={isLoadingEmployees}
                            />
                        </Col>
                    </>
                )}

                {user?.role !== 'EMPLOYEE' && (
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Pending Approvals"
                            value={pendingCount}
                            icon={<FileDoneOutlined />}
                            color="amber"
                            loading={isLoadingApprovals}
                        />
                    </Col>
                )}

                <Col xs={24} sm={12} lg={6}>
                    <StatCard
                        title="Available Leave"
                        value={availableLeave}
                        suffix="Days"
                        icon={<ClockCircleOutlined />}
                        color="green"
                        loading={isLoadingBalances}
                    />
                </Col>
            </Row>

            {/* Activity + Quick Actions */}
            <Row gutter={[20, 20]}>
                <Col xs={24} lg={16}>
                    <Card
                        title={<span className="font-semibold text-slate-800">Recent Activity</span>}
                        bordered={false}
                        className="h-full"
                        style={{ borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    >
                        {activityFeed.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="text-4xl mb-3">📋</div>
                                <Text className="text-slate-400 italic">No recent activity found.</Text>
                            </div>
                        ) : (
                            <List
                                dataSource={activityFeed}
                                renderItem={(item: any) => (
                                    <List.Item className="!px-0 !py-3 border-b border-slate-100/80 last:border-0">
                                        <div className="flex items-start gap-3 w-full">
                                            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-100">
                                                {item.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-medium text-slate-800 text-sm">{item.title}</span>
                                                    {item.tag && <Tag color={item.tagColor} className="border-none text-xs">{item.tag}</Tag>}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>
                                            </div>
                                            <div className="text-xs text-slate-400 flex-shrink-0">{dayjs(item.time).fromNow()}</div>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card
                        title={<span className="font-semibold text-slate-800">Quick Actions</span>}
                        bordered={false}
                        className="h-full"
                        style={{ borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    >
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => navigate('/leave/mine')}
                                className="group flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl p-4 text-left transition-all font-medium text-slate-700 hover:text-slate-900"
                            >
                                <span>📋 &nbsp;Apply for Leave</span>
                                <ArrowRightOutlined className="text-slate-400 group-hover:text-slate-600 transition-colors text-xs" />
                            </button>
                            <button
                                onClick={() => navigate('/attendance/mine')}
                                className="group flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl p-4 text-left transition-all font-medium text-slate-700 hover:text-slate-900"
                            >
                                <span>🕐 &nbsp;My Attendance</span>
                                <ArrowRightOutlined className="text-slate-400 group-hover:text-slate-600 transition-colors text-xs" />
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => navigate('/employees/new')}
                                    className="group flex items-center justify-between bg-red-50 hover:bg-red-100 border border-red-200/80 text-red-700 hover:text-red-900 rounded-xl p-4 text-left transition-all font-medium"
                                >
                                    <span>➕ &nbsp;Add New Employee</span>
                                    <ArrowRightOutlined className="text-red-400 group-hover:text-red-600 transition-colors text-xs" />
                                </button>
                            )}
                            {isAdmin && (
                                <button
                                    onClick={() => navigate('/reports')}
                                    className="group flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl p-4 text-left transition-all font-medium text-slate-700 hover:text-slate-900"
                                >
                                    <span>📊 &nbsp;View Reports</span>
                                    <ArrowRightOutlined className="text-slate-400 group-hover:text-slate-600 transition-colors text-xs" />
                                </button>
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>

            {isSuperAdmin && (
                <Card
                    title={<span className="font-semibold text-slate-800">Financial Overview</span>}
                    extra={
                        <button
                            onClick={() => navigate('/reports')}
                            className="text-sm font-medium text-[#26428b] hover:text-[#1d3270] transition-colors"
                        >
                            Open detailed payroll analytics
                        </button>
                    }
                    bordered={false}
                    style={{ borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                >
                    <Spin spinning={isLoadingSalaryMetrics}>
                        <div className="flex flex-col gap-6">
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={8}>
                                    <div className="rounded-2xl border border-[#26428b]/10 bg-[#26428b]/[0.03] p-5">
                                        <div className="mb-3 flex items-center justify-between">
                                            <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Annual Salary Cost</Text>
                                            <DollarCircleOutlined style={{ color: '#26428b' }} />
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {formatCurrency((salaryMetrics?.summary?.totalAnnualCtc || 0) * 12)}
                                        </div>
                                        <Text className="text-slate-500">Combined annual CTC across active employees</Text>
                                    </div>
                                </Col>
                                <Col xs={24} md={8}>
                                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                                        <div className="mb-3 flex items-center justify-between">
                                            <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Monthly In-Hand</Text>
                                            <WalletOutlined style={{ color: '#047857' }} />
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {formatCurrency(salaryMetrics?.summary?.totalMonthlyInHand || 0)}
                                        </div>
                                        <Text className="text-slate-500">Estimated take-home payout per month</Text>
                                    </div>
                                </Col>
                                <Col xs={24} md={8}>
                                    <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
                                        <div className="mb-3 flex items-center justify-between">
                                            <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Average CTC</Text>
                                            <BankOutlined style={{ color: '#b45309' }} />
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900">
                                            {formatCurrency((salaryMetrics?.summary?.averageCtcPerEmployee || 0) * 12)}
                                        </div>
                                        <Text className="text-slate-500">
                                            Based on {salaryMetrics?.summary?.totalActiveEmployees || 0} active employees
                                        </Text>
                                    </div>
                                </Col>
                            </Row>

                            <Table
                                columns={financialColumns}
                                dataSource={financialRows}
                                rowKey="department"
                                pagination={false}
                                locale={{ emptyText: 'No salary data available yet.' }}
                                size="middle"
                            />
                        </div>
                    </Spin>
                </Card>
            )}
        </div>
    );
}
