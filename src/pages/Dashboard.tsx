import { Typography, Row, Col, Card, Statistic, Spin, List, Tag } from 'antd';
import { TeamOutlined, RiseOutlined, FileDoneOutlined, ClockCircleOutlined, UserAddOutlined, CalendarOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

export default function Dashboard() {
    const user = useAuthStore(state => state.user);
    const navigate = useNavigate();

    // Fetch Total Employees (Only for Admin/HR)
    const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
        queryKey: ['employees', 'dashboard'],
        queryFn: async () => {
            const res = await apiClient.get('/employees?limit=1');
            return res.data;
        },
        enabled: user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN',
    });

    // Fetch Pending Approvals
    const { data: pendingApprovals, isLoading: isLoadingApprovals } = useQuery({
        queryKey: ['leave', 'pending-approvals'],
        queryFn: async () => {
            const res = await apiClient.get('/leave/pending-approvals');
            return res.data;
        },
        enabled: user?.role !== 'EMPLOYEE',
    });

    // Fetch Available Leave
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

    // On Leave count from employees endpoint
    const { data: onLeaveData } = useQuery({
        queryKey: ['employees', 'on-leave-count'],
        queryFn: async () => {
            const res = await apiClient.get('/employees?limit=1&status=ON_LEAVE');
            return res.data?.meta?.total || 0;
        },
        enabled: isAdmin,
    });

    // Fetch recent leave requests for activity feed
    const { data: recentLeaves = [] } = useQuery({
        queryKey: ['leave', 'mine', 'recent'],
        queryFn: async () => {
            const res = await apiClient.get('/leave/mine');
            return (res.data || []).slice(0, 5);
        },
        retry: false,
    });

    // Fetch recently added employees (admins/HR only)
    const { data: recentEmployeesData } = useQuery({
        queryKey: ['employees', 'recent'],
        queryFn: async () => {
            const res = await apiClient.get('/employees?limit=5&sortBy=createdAt&order=desc');
            return res.data?.data || [];
        },
        enabled: isAdmin,
    });

    // Build a unified activity feed
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

    return (
        <div className="flex flex-col gap-6">
            <div>
                <Title level={2} className="!mb-1">Dashboard</Title>
                <Text className="text-slate-500">Overview of your HR metrics and quick actions.</Text>
            </div>

            <Row gutter={[16, 16]}>
                {(user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN') && (
                    <>
                        <Col xs={24} sm={12} lg={6}>
                            <Card bordered={false} className="shadow-sm border-t-2 border-t-brand-red h-full">
                                <Spin spinning={isLoadingEmployees}>
                                    <Statistic
                                        title={<span className="text-slate-500 font-medium">Total Employees</span>}
                                        value={totalEmployees}
                                        prefix={<TeamOutlined className="text-brand-red pr-2" />}
                                        valueStyle={{ color: '#0f172a' }}
                                    />
                                </Spin>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card bordered={false} className="shadow-sm border-t-2 border-t-blue-500 h-full">
                                <Spin spinning={isLoadingEmployees}>
                                    <Statistic
                                        title={<span className="text-slate-500 font-medium">On Leave Today</span>}
                                        value={onLeaveData ?? 0}
                                        prefix={<RiseOutlined className="text-blue-500 pr-2" />}
                                        valueStyle={{ color: '#0f172a' }}
                                    />
                                </Spin>
                            </Card>
                        </Col>
                    </>
                )}

                {user?.role !== 'EMPLOYEE' && (
                    <Col xs={24} sm={12} lg={6}>
                        <Card bordered={false} className="shadow-sm border-t-2 border-t-amber-500 h-full">
                            <Spin spinning={isLoadingApprovals}>
                                <Statistic
                                    title={<span className="text-slate-500 font-medium">Pending Approvals</span>}
                                    value={pendingCount}
                                    prefix={<FileDoneOutlined className="text-amber-500 pr-2" />}
                                    valueStyle={{ color: '#0f172a' }}
                                />
                            </Spin>
                        </Card>
                    </Col>
                )}

                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm border-t-2 border-t-green-500 h-full">
                        <Spin spinning={isLoadingBalances}>
                            <Statistic
                                title={<span className="text-slate-500 font-medium">Available Leave</span>}
                                value={availableLeave}
                                suffix="Days"
                                prefix={<ClockCircleOutlined className="text-green-500 pr-2" />}
                                valueStyle={{ color: '#0f172a' }}
                            />
                        </Spin>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                    <Card title="Recent Activity" bordered={false} className="h-full shadow-sm">
                        {activityFeed.length === 0 ? (
                            <Text className="text-slate-400 italic">No recent activity found.</Text>
                        ) : (
                            <List
                                dataSource={activityFeed}
                                renderItem={(item: any) => (
                                    <List.Item className="!px-0 !py-3 border-b border-slate-100 last:border-0">
                                        <div className="flex items-start gap-3 w-full">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
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
                    <Card title="Quick Actions" bordered={false} className="h-full shadow-sm">
                        <div className="flex flex-col gap-3">
                            <button onClick={() => navigate('/leave/mine')} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-3 text-left transition-all font-medium text-slate-700 hover:text-slate-900">
                                📋 &nbsp;Apply for Leave
                            </button>
                            <button onClick={() => navigate('/attendance/mine')} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-3 text-left transition-all font-medium text-slate-700 hover:text-slate-900">
                                🕐 &nbsp;My Attendance
                            </button>
                            {isAdmin && (
                                <button onClick={() => navigate('/employees/new')} className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-900 rounded-lg p-3 text-left transition-all font-medium">
                                    ➕ &nbsp;Add New Employee
                                </button>
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
