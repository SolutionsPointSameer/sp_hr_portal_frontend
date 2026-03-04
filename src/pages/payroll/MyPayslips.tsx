import { Typography, Card, Button, Table, Tag } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

const { Title, Text } = Typography;

export default function MyPayslips() {
    const { data: payslips, isLoading } = useQuery({
        queryKey: ['payroll', 'my-payslips'],
        queryFn: async () => {
            const res = await apiClient.get('/payroll/my-payslips');
            return res.data;
        }
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
    };

    const getMonthName = (monthNum: number) => {
        const date = new Date();
        date.setMonth(monthNum - 1);
        return date.toLocaleString('en-US', { month: 'long' });
    };

    const columns = [
        {
            title: 'Month',
            dataIndex: 'month',
            key: 'month',
            className: 'font-medium',
            render: (month: number) => getMonthName(month)
        },
        { title: 'Year', dataIndex: 'year', key: 'year' },
        {
            title: 'Gross Pay',
            dataIndex: 'grossPay',
            key: 'grossPay',
            render: (amount: number) => formatCurrency(amount)
        },
        {
            title: 'Deductions',
            dataIndex: 'deductions',
            key: 'deductions',
            render: (amount: number) => formatCurrency(amount),
            className: 'text-brand-red'
        },
        {
            title: 'Net Pay',
            dataIndex: 'netPay',
            key: 'netPay',
            render: (amount: number) => <span className="text-green-500 font-medium">{formatCurrency(amount)}</span>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'FINALIZED' ? 'success' : 'default'} className="border-none">
                    {status || 'UNKNOWN'}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: any) => (
                <Button
                    type="text"
                    icon={<DownloadOutlined />}
                    className="text-brand-red hover:text-red-400"
                    disabled={record.status !== 'FINALIZED'}
                    onClick={() => console.log('Download not implemented yet')}
                >
                    Download PDF
                </Button>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div>
                    <Title level={3} className="!mb-1">My Payslips</Title>
                    <Text className="text-slate-500">View and download your monthly salary slips.</Text>
                </div>
            </div>

            <Card bordered={false} className="shadow-sm">
                <Table
                    columns={columns}
                    dataSource={payslips || []}
                    rowKey="id"
                    pagination={{ pageSize: 12 }}
                    loading={isLoading}
                    className="custom-table"
                    locale={{ emptyText: 'No payslips found' }}
                />
            </Card>
        </div>
    );
}
