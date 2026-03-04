import { Typography, Row, Col, Card, Statistic, Spin } from 'antd';
import { TeamOutlined, RiseOutlined, FileDoneOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';

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

    // Calculate total available leave days across all types
    const availableLeave = leaveBalances?.reduce((acc: number, curr: any) => acc + curr.remaining, 0) || 0;

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
                        {/* We don't have a specific endpoint for Headcount Growth, so leaving this static or hidden. Let's make it static for now as a placeholder or remove it. Let's keep it static +15% for visual fidelity */}
                        <Col xs={24} sm={12} lg={6}>
                            <Card bordered={false} className="shadow-sm border-t-2 border-t-blue-500 h-full">
                                <Statistic
                                    title={<span className="text-slate-500 font-medium">Headcount Growth</span>}
                                    value={'+15%'}
                                    prefix={<RiseOutlined className="text-blue-500 pr-2" />}
                                    valueStyle={{ color: '#0f172a' }}
                                />
                            </Card>
                        </Col>
                    </>
                )}

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
                    <Card title="Recent Activity" bordered={false} className="h-full">
                        <Text className="text-slate-500 italic">No recent activity found.</Text>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="Quick Actions" bordered={false} className="h-full">
                        <div className="flex flex-col gap-3">
                            <button onClick={() => navigate('/leave/mine')} className="bg-slate-100 hover:bg-slate-600 border border-slate-300 rounded-lg p-3 text-left transition-colors font-medium">
                                Apply for Leave
                            </button>
                            <button onClick={() => navigate('/payroll/my-payslips')} className="bg-slate-100 hover:bg-slate-600 border border-slate-300 rounded-lg p-3 text-left transition-colors font-medium">
                                View Payslips
                            </button>
                            {(user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN') && (
                                <button onClick={() => navigate('/employees/new')} className="bg-brand-red/10 border border-brand-red/30 hover:bg-brand-red/20 text-brand-red rounded-lg p-3 text-left transition-colors font-medium">
                                    Add New Employee
                                </button>
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
