import { Typography, Card, Tabs, Button, Select, Row, Col, Statistic, Spin, Table, Tag } from 'antd';
import { DownloadOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined, DollarOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Reports() {
    const user = useAuthStore(state => state.user);
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    // Fetch Headcount
    const { data: headcountData, isLoading: headercountLoading } = useQuery({
        queryKey: ['reports', 'headcount'],
        queryFn: async () => {
            const res = await apiClient.get('/reports/headcount');
            return res.data;
        }
    });

    // Fetch Attrition
    const { data: attritionData, isLoading: attritionLoading } = useQuery({
        queryKey: ['reports', 'attrition'],
        queryFn: async () => {
            const res = await apiClient.get('/reports/attrition');
            return res.data;
        }
    });

    // Fetch Leave Utilization
    const { data: leaveData, isLoading: leaveLoading } = useQuery({
        queryKey: ['reports', 'leave-utilization'],
        queryFn: async () => {
            const res = await apiClient.get('/reports/leave-utilization');
            return res.data;
        }
    });

    // Fetch Salary Metrics (SUPER_ADMIN only)
    const { data: salaryMetrics, isLoading: salaryLoading } = useQuery({
        queryKey: ['reports', 'salary-metrics'],
        queryFn: async () => {
            const res = await apiClient.get('/reports/salary-metrics');
            return res.data;
        },
        enabled: isSuperAdmin,
    });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

    const operations = (
        <div className="flex gap-2">
            <Button icon={<DownloadOutlined />} size="small" className="text-slate-600 border-slate-300 hover:text-slate-900">PDF</Button>
            <Button icon={<DownloadOutlined />} size="small" className="text-slate-600 border-slate-300 hover:text-slate-900">CSV</Button>
        </div>
    );

    const ReportPlaceholder = ({ title, icon, value, desc, loading }: { title: string, icon: React.ReactNode, value: string | number, desc: string, loading: boolean }) => (
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px] border border-dashed border-slate-200 rounded-lg bg-slate-50/50 relative">
            {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10"><Spin /></div>}
            <div className="text-5xl text-slate-600 mb-6">{icon}</div>
            <Row gutter={[32, 32]} className="w-full max-w-2xl text-center flex items-center justify-center">
                <Col span={12}>
                    <Statistic title={<span className="text-slate-500">{title}</span>} value={value} valueStyle={{ color: '#E00C05', fontSize: '36px', fontWeight: 'bold' }} />
                    <Text className="text-slate-500 mt-2 block">{desc}</Text>
                </Col>
            </Row>
            <div className="mt-12 text-slate-500 italic flex flex-col items-center">
                <p>Chart renders automatically with real data fetched from the API.</p>
                <div className="flex gap-2 mt-4">
                    <Select defaultValue="all" className="w-40 bg-white" size="small">
                        <Option value="all">All Departments</Option>
                        <Option value="eng">Engineering</Option>
                        <Option value="sales">Sales</Option>
                    </Select>
                    <Select defaultValue="ytd" className="w-32 bg-white" size="small">
                        <Option value="ytd">Year to Date</Option>
                        <Option value="q1">Q1</Option>
                    </Select>
                </div>
            </div>
        </div>
    );

    // Department breakdown columns
    const deptColumns = [
        {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
            render: (text: string) => <span className="font-medium">{text || 'Unassigned'}</span>,
        },
        {
            title: 'Employees',
            dataIndex: 'employeeCount',
            key: 'employeeCount',
        },
        {
            title: 'Total CTC (Monthly)',
            dataIndex: 'totalCtc',
            key: 'totalCtc',
            render: (val: number) => <span className="font-mono">{formatCurrency(val)}</span>,
        },
        {
            title: 'Total In-Hand (Monthly)',
            dataIndex: 'totalInHand',
            key: 'totalInHand',
            render: (val: number) => <span className="font-mono text-green-700">{formatCurrency(val)}</span>,
        },
        {
            title: 'Avg CTC',
            dataIndex: 'avgCtc',
            key: 'avgCtc',
            render: (val: number) => <span className="font-mono text-slate-500">{formatCurrency(val)}</span>,
        },
    ];

    // Individual employee salary columns
    const empSalaryColumns = [
        {
            title: 'Employee',
            key: 'employee',
            render: (_: any, r: any) => (
                <div>
                    <div className="font-medium text-slate-800">{r.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{r.employeeCode}</div>
                </div>
            ),
        },
        {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
            render: (text: string) => text || '-',
        },
        {
            title: 'Designation',
            dataIndex: 'designation',
            key: 'designation',
            render: (text: string) => text || '-',
        },
        {
            title: 'CTC (Monthly)',
            dataIndex: 'ctc',
            key: 'ctc',
            render: (val: number) => <span className="font-mono">{val ? formatCurrency(val) : '-'}</span>,
        },
        {
            title: 'In-Hand (Monthly)',
            dataIndex: 'inHandSalary',
            key: 'inHandSalary',
            render: (val: number) => <span className="font-mono text-green-700">{val ? formatCurrency(val) : '-'}</span>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (s: string) => (
                <Tag color={s === 'ACTIVE' ? 'success' : 'warning'} className="border-none">
                    {s?.replace('_', ' ')}
                </Tag>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div>
                    <Title level={3} className="!mb-1">HR Reports &amp; Analytics</Title>
                    <Text className="text-slate-500">Gain insights into workforce metrics and trends.</Text>
                </div>
            </div>

            <Card bordered={false} className="shadow-sm p-2">
                <Tabs defaultActiveKey="1" tabBarExtraContent={operations}>
                    <Tabs.TabPane tab="Headcount" key="1">
                        <ReportPlaceholder
                            title="Active Headcount"
                            value={headcountData?.total || 0}
                            desc={`+${headcountData?.growth || 0}% vs Last Year`}
                            icon={<BarChartOutlined />}
                            loading={headercountLoading}
                        />
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Attrition" key="2">
                        <ReportPlaceholder
                            title="Annual Attrition Rate"
                            value={`${attritionData?.rate || 0}%`}
                            desc={`${attritionData?.trend || 0}% vs Last Year`}
                            icon={<LineChartOutlined />}
                            loading={attritionLoading}
                        />
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Leave Utilization" key="3">
                        <ReportPlaceholder
                            title="Avg Leaves Taken"
                            value={`${leaveData?.avgTaken || 0} days`}
                            desc="Per employee YTD"
                            icon={<PieChartOutlined />}
                            loading={leaveLoading}
                        />
                    </Tabs.TabPane>

                    {/* Salary Metrics — SUPER_ADMIN only */}
                    {isSuperAdmin && (
                        <Tabs.TabPane tab={<span><DollarOutlined className="mr-1" />Salary Metrics</span>} key="5">
                            {salaryLoading ? (
                                <div className="flex justify-center py-16"><Spin size="large" /></div>
                            ) : (
                                <div className="flex flex-col gap-6 py-4">
                                    {/* Summary Cards */}
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} sm={12} lg={6}>
                                            <Card bordered={false} className="bg-slate-50 border border-slate-100">
                                                <Statistic
                                                    title={<span className="text-slate-500 text-sm">Total Monthly CTC</span>}
                                                    value={formatCurrency(salaryMetrics?.totalCtc ?? 0)}
                                                    valueStyle={{ color: '#0f172a', fontSize: '20px' }}
                                                />
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={12} lg={6}>
                                            <Card bordered={false} className="bg-slate-50 border border-slate-100">
                                                <Statistic
                                                    title={<span className="text-slate-500 text-sm">Monthly In-Hand Payout</span>}
                                                    value={formatCurrency(salaryMetrics?.totalInHand ?? 0)}
                                                    valueStyle={{ color: '#16a34a', fontSize: '20px' }}
                                                />
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={12} lg={6}>
                                            <Card bordered={false} className="bg-slate-50 border border-slate-100">
                                                <Statistic
                                                    title={<span className="text-slate-500 text-sm">Average CTC / Employee</span>}
                                                    value={formatCurrency(salaryMetrics?.avgCtc ?? 0)}
                                                    valueStyle={{ color: '#0f172a', fontSize: '20px' }}
                                                />
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={12} lg={6}>
                                            <Card bordered={false} className="bg-slate-50 border border-slate-100">
                                                <Statistic
                                                    title={<span className="text-slate-500 text-sm">Employees with Salary</span>}
                                                    value={salaryMetrics?.employeesWithSalary ?? 0}
                                                    suffix={<span className="text-base text-slate-400">/ {salaryMetrics?.totalEmployees ?? 0}</span>}
                                                    valueStyle={{ color: '#0f172a', fontSize: '20px' }}
                                                />
                                            </Card>
                                        </Col>
                                    </Row>

                                    {/* Department Breakdown */}
                                    {salaryMetrics?.byDepartment?.length > 0 && (
                                        <Card
                                            title="By Department"
                                            bordered={false}
                                            className="border border-slate-100"
                                            headStyle={{ borderBottom: '1px solid #f1f5f9', fontSize: '14px', fontWeight: 600 }}
                                        >
                                            <Table
                                                columns={deptColumns}
                                                dataSource={salaryMetrics.byDepartment}
                                                rowKey="department"
                                                pagination={false}
                                                size="small"
                                                className="custom-table"
                                            />
                                        </Card>
                                    )}

                                    {/* Individual Employee Salaries */}
                                    {salaryMetrics?.employees?.length > 0 && (
                                        <Card
                                            title="Individual Salary Breakdown"
                                            bordered={false}
                                            className="border border-slate-100"
                                            headStyle={{ borderBottom: '1px solid #f1f5f9', fontSize: '14px', fontWeight: 600 }}
                                        >
                                            <Table
                                                columns={empSalaryColumns}
                                                dataSource={salaryMetrics.employees}
                                                rowKey="id"
                                                pagination={{ pageSize: 10, showSizeChanger: true }}
                                                size="small"
                                                className="custom-table"
                                            />
                                        </Card>
                                    )}
                                </div>
                            )}
                        </Tabs.TabPane>
                    )}
                </Tabs>
            </Card>
        </div>
    );
}
