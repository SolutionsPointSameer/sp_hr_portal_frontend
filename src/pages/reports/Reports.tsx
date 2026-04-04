import { Typography, Card, Tabs, Button, Select, Row, Col, Statistic, Spin, Table, Tag } from 'antd';
import { DownloadOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined, DollarOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
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
        <div className="flex gap-2 mr-6">
            <Button icon={<DownloadOutlined />} size="small" className="!rounded-lg text-slate-600 border-slate-200">Export PDF</Button>
            <Button icon={<DownloadOutlined />} size="small" className="!rounded-lg text-slate-600 border-slate-200">CSV</Button>
        </div>
    );

    const ReportPlaceholder = ({ title, icon, value, desc, loading, trend }: { title: string, icon: React.ReactNode, value: string | number, desc: string, loading: boolean, trend?: 'up' | 'down' }) => (
        <div className="p-8 flex flex-col items-center justify-center min-h-[420px] rounded-2xl bg-white border border-slate-100 relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                <div className="text-[120px]">{icon}</div>
            </div>
            
            {loading && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10"><Spin size="large" /></div>}
            
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl text-[#26428b] mb-6 shadow-sm">
                {icon}
            </div>
            
            <div className="text-center z-10">
                <Text className="text-slate-400 font-medium uppercase tracking-wider text-xs mb-2 block">{title}</Text>
                <div className="text-5xl font-bold mb-3 tracking-tight" style={{ color: '#0f172a' }}>{value}</div>
                <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 inline-flex">
                    {trend === 'up' ? <ArrowUpOutlined className="text-green-500 text-xs" /> : <ArrowDownOutlined className="text-red-500 text-xs" />}
                    <Text className="text-slate-500 text-sm font-medium">{desc}</Text>
                </div>
            </div>

            <div className="mt-12 w-full max-w-sm">
                <div className="flex gap-2">
                    <Select defaultValue="all" className="flex-1 custom-select" size="middle">
                        <Option value="all">Global View</Option>
                        <Option value="eng">Engineering</Option>
                        <Option value="sales">Sales</Option>
                        <Option value="ops">Operations</Option>
                    </Select>
                    <Select defaultValue="ytd" className="w-32 custom-select" size="middle">
                        <Option value="ytd">YTD</Option>
                        <Option value="q1">Q1</Option>
                        <Option value="q2">Q2</Option>
                    </Select>
                </div>
                <p className="text-[10px] text-slate-400 text-center mt-4">Interactive charts are being generated from historical trends...</p>
            </div>
        </div>
    );

    const deptColumns = [
        {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
            render: (text: string) => <span className="font-semibold text-slate-700">{text || 'Unassigned'}</span>,
        },
        {
            title: 'Headcount',
            dataIndex: 'employeeCount',
            key: 'employeeCount',
            className: 'text-center',
        },
        {
            title: 'Total CTC (Month)',
            dataIndex: 'totalCtc',
            key: 'totalCtc',
            render: (val: number) => <span className="font-mono text-slate-600">{formatCurrency(val)}</span>,
        },
        {
            title: 'Net Payout',
            dataIndex: 'totalInHand',
            key: 'totalInHand',
            render: (val: number) => <span className="font-mono text-green-600 font-medium">{formatCurrency(val)}</span>,
        },
        {
            title: 'Avg. CTC',
            dataIndex: 'avgCtc',
            key: 'avgCtc',
            render: (val: number) => <span className="font-mono text-slate-400">{formatCurrency(val)}</span>,
        },
    ];

    const empSalaryColumns = [
        {
            title: 'Employee Details',
            key: 'employee',
            render: (_: any, r: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 leading-tight">{r.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-tighter font-mono">{r.employeeCode}</span>
                </div>
            ),
        },
        {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
            render: (text: string) => <Tag className="rounded-md border-none bg-slate-100 text-slate-600 font-medium">{text || '-'}</Tag>,
        },
        {
            title: 'CTC (Monthly)',
            dataIndex: 'ctc',
            key: 'ctc',
            render: (val: number) => <span className="font-mono font-medium">{val ? formatCurrency(val) : '-'}</span>,
        },
        {
            title: 'In-Hand',
            dataIndex: 'inHandSalary',
            key: 'inHandSalary',
            render: (val: number) => <span className="font-mono text-green-600 font-bold">{val ? formatCurrency(val) : '-'}</span>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (s: string) => (
                <Tag color={s === 'ACTIVE' ? 'success' : 'default'} className="rounded-full px-2.5 border-none font-medium">
                    {s?.replace('_', ' ')}
                </Tag>
            ),
        },
    ];

    const tabItems = [
        {
            key: 'headcount',
            label: 'Headcount',
            children: (
                <ReportPlaceholder
                    title="Current Active Roster"
                    value={headcountData?.total || 0}
                    desc={`+${headcountData?.growth || 0}% Growth Year-over-Year`}
                    icon={<BarChartOutlined />}
                    loading={headercountLoading}
                    trend="up"
                />
            )
        },
        {
            key: 'attrition',
            label: 'Attrition',
            children: (
                <ReportPlaceholder
                    title="Annual Separation Rate"
                    value={`${attritionData?.rate || 0}%`}
                    desc={`${attritionData?.trend || 0}% Reduced since last Quarter`}
                    icon={<LineChartOutlined />}
                    loading={attritionLoading}
                    trend="down"
                />
            )
        },
        {
            key: 'leaves',
            label: 'Utilization',
            children: (
                <ReportPlaceholder
                    title="Average Annual Leave Load"
                    value={`${leaveData?.avgTaken || 0} days`}
                    desc="Steady utilization this Season"
                    icon={<PieChartOutlined />}
                    loading={leaveLoading}
                    trend="up"
                />
            )
        },
        ...(isSuperAdmin ? [{
            key: 'payroll',
            label: (<span><DollarOutlined className="mr-1" />Payroll Analytics</span>),
            children: (
                <div className="flex flex-col gap-8 animate-fade-in py-2">
                    {salaryLoading ? (
                        <div className="flex justify-center py-24"><Spin size="large" /></div>
                    ) : (
                        <>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} sm={12} lg={6}>
                                    <div className="p-6 rounded-2xl bg-[#26428b]/[0.02] border border-[#26428b]/10">
                                        <Statistic
                                            title={<span className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">Total Monthly CTC</span>}
                                            value={formatCurrency(salaryMetrics?.totalCtc ?? 0)}
                                            valueStyle={{ color: '#26428b', fontSize: '22px', fontWeight: 'bold' }}
                                        />
                                    </div>
                                </Col>
                                <Col xs={24} sm={12} lg={6}>
                                    <div className="p-6 rounded-2xl bg-green-50/50 border border-green-100">
                                        <Statistic
                                            title={<span className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">Net Cash Outflow</span>}
                                            value={formatCurrency(salaryMetrics?.totalInHand ?? 0)}
                                            valueStyle={{ color: '#059669', fontSize: '22px', fontWeight: 'bold' }}
                                        />
                                    </div>
                                </Col>
                                <Col xs={24} sm={12} lg={6}>
                                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                        <Statistic
                                            title={<span className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">Average CTC Buffer</span>}
                                            value={formatCurrency(salaryMetrics?.avgCtc ?? 0)}
                                            valueStyle={{ color: '#0f172a', fontSize: '22px', fontWeight: 'bold' }}
                                        />
                                    </div>
                                </Col>
                                <Col xs={24} sm={12} lg={6}>
                                    <div className="p-6 rounded-2xl bg-amber-50/30 border border-amber-100">
                                        <Statistic
                                            title={<span className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">Payroll Enrollment</span>}
                                            value={salaryMetrics?.employeesWithSalary ?? 0}
                                            suffix={<span className="text-sm text-slate-400 font-normal"> / {salaryMetrics?.totalEmployees ?? 0}</span>}
                                            valueStyle={{ color: '#b45309', fontSize: '22px', fontWeight: 'bold' }}
                                        />
                                    </div>
                                </Col>
                            </Row>

                            <div className="grid grid-cols-1 gap-8">
                                <Card
                                    title={<span className="flex items-center gap-2"><div className="w-1 h-4 bg-[#e00c05] rounded-full" />Department Performance</span>}
                                    bordered={false}
                                    className="rounded-2xl border border-slate-100 shadow-sm"
                                    headStyle={{ borderBottom: '1px solid #f8fafc', padding: '16px 24px' }}
                                >
                                    <Table
                                        columns={deptColumns}
                                        dataSource={salaryMetrics?.byDepartment || []}
                                        rowKey="department"
                                        pagination={false}
                                        size="middle"
                                        className="custom-table"
                                    />
                                </Card>

                                <Card
                                    title={<span className="flex items-center gap-2"><div className="w-1 h-4 bg-[#26428b] rounded-full" />Detailed Salary Audit</span>}
                                    bordered={false}
                                    className="rounded-2xl border border-slate-100 shadow-sm"
                                    headStyle={{ borderBottom: '1px solid #f8fafc', padding: '16px 24px' }}
                                >
                                    <Table
                                        columns={empSalaryColumns}
                                        dataSource={salaryMetrics?.employees || []}
                                        rowKey="id"
                                        pagination={{ pageSize: 8, size: 'small' }}
                                        size="middle"
                                        className="custom-table"
                                    />
                                </Card>
                            </div>
                        </>
                    )}
                </div>
            )
        }] : [])
    ];

    return (
        <div className="p-4 sm:p-8 space-y-8 animate-fade-in max-w-[1400px] mx-auto min-h-screen">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Title level={2} className="!mb-1 page-heading" style={{ color: '#26428b' }}>
                        HR Reports & Analytics
                    </Title>
                    <Text className="text-slate-500 font-medium">Gain strategic insights into workforce productivity and payroll distribution.</Text>
                </div>
            </div>

            <Card 
                className="shadow-xl border-slate-100 rounded-2xl overflow-hidden" 
                style={{ borderRadius: '16px', boxShadow: '0 20px 50px -12px rgba(38, 66, 139, 0.08)' }}
                bodyStyle={{ padding: '0px' }}
            >
                <Tabs 
                    defaultActiveKey="headcount" 
                    tabBarExtraContent={operations}
                    items={tabItems}
                    className="master-data-tabs"
                    style={{ padding: '0 24px 24px 24px' }}
                />
            </Card>
        </div>
    );
}
