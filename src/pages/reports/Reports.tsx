import { Typography, Card, Tabs, Button, Select, Row, Col, Statistic, Spin } from 'antd';
import { DownloadOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Reports() {

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

    // Fetch Payroll Cost
    const { data: payrollData, isLoading: payrollLoading } = useQuery({
        queryKey: ['reports', 'payroll-cost'],
        queryFn: async () => {
            const res = await apiClient.get('/reports/payroll-cost');
            return res.data;
        }
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
    };

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

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div>
                    <Title level={3} className="!mb-1">HR Reports & Analytics</Title>
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
                    <Tabs.TabPane tab="Cost Summary" key="4">
                        <ReportPlaceholder
                            title="Total Payroll YTD"
                            value={formatCurrency(payrollData?.totalYtd || 0)}
                            desc="Gross disbursed"
                            icon={<BarChartOutlined />}
                            loading={payrollLoading}
                        />
                    </Tabs.TabPane>
                </Tabs>
            </Card>
        </div>
    );
}
