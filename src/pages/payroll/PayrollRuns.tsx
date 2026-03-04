import { Typography, Card, Button, Table, Tag, Modal, DatePicker, Form, message } from 'antd';
import { PlayCircleOutlined, FileDoneOutlined, SettingOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function PayrollRuns() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    // Fetch Payroll Runs
    const { data: runs, isLoading } = useQuery({
        queryKey: ['payroll', 'runs'],
        queryFn: async () => {
            const res = await apiClient.get('/payroll/runs');
            return res.data;
        }
    });

    // Initiate Payroll Run Mutation
    const initiateRunMutation = useMutation({
        mutationFn: async (values: any) => {
            const date = values.month;
            const payload = {
                month: date.month() + 1,
                year: date.year()
            };
            const res = await apiClient.post('/payroll/runs', payload);
            return res.data;
        },
        onSuccess: () => {
            message.success('Payroll run initiated successfully');
            setIsModalOpen(false);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['payroll', 'runs'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to initiate payroll run');
        }
    });

    // Generate Payslips Mutation (Optional Step depending on API, but let's assume we need to finalize)
    // Actually API docs say POST /payroll/runs/:id/generate and POST /payroll/runs/:id/finalize. Let's just do generate/finalize in sequence or just finalize. 
    // Wait, let's implement Finalize first as requested. We can add a "Generate" action if the state is DRAFT.
    const generateMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.post(`/payroll/runs/${id}/generate`);
            return res.data;
        },
        onSuccess: () => {
            message.success('Payslips generated for run');
            queryClient.invalidateQueries({ queryKey: ['payroll', 'runs'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to generate payslips');
        }
    });

    const finalizeMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.post(`/payroll/runs/${id}/finalize`);
            return res.data;
        },
        onSuccess: () => {
            message.success('Payroll run finalized successfully');
            queryClient.invalidateQueries({ queryKey: ['payroll', 'runs'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to finalize payroll run');
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

    const handleInitiate = () => {
        form.validateFields().then(values => {
            initiateRunMutation.mutate(values);
        });
    };

    const handleGenerate = (id: string) => {
        generateMutation.mutate(id);
    };

    const handleFinalize = (id: string) => {
        finalizeMutation.mutate(id);
    };

    const columns = [
        { title: 'Run ID', dataIndex: 'id', key: 'id', className: 'font-mono text-slate-600', render: (id: string) => id.substring(0, 8) + '...' },
        {
            title: 'Period',
            key: 'period',
            className: 'font-medium',
            render: (_: any, record: any) => `${getMonthName(record.month)} ${record.year}`
        },
        {
            title: 'Total Gross',
            dataIndex: 'totalGross',
            key: 'totalGross',
            render: (amount: number) => amount ? formatCurrency(amount) : '-'
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            className: 'text-slate-500',
            render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'FINALIZED' ? 'success' : (status === 'GENERATED' ? 'processing' : 'default')} className="border-none">
                    {status}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: any) => (
                <div className="flex gap-2">
                    {record.status === 'DRAFT' && (
                        <Button
                            size="small"
                            icon={<SettingOutlined />}
                            onClick={() => handleGenerate(record.id)}
                            loading={generateMutation.isPending && generateMutation.variables === record.id}
                        >
                            Generate
                        </Button>
                    )}
                    {(record.status === 'DRAFT' || record.status === 'GENERATED') && (
                        <Button
                            type="primary"
                            size="small"
                            icon={<FileDoneOutlined />}
                            onClick={() => handleFinalize(record.id)}
                            loading={finalizeMutation.isPending && finalizeMutation.variables === record.id}
                        >
                            Finalize
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div>
                    <Title level={3} className="!mb-1">Payroll Management</Title>
                    <Text className="text-slate-500">Initiate runs and publish monthly payslips.</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => setIsModalOpen(true)}
                >
                    Initiate New Run
                </Button>
            </div>

            <Card bordered={false} className="shadow-sm">
                <Table
                    columns={columns}
                    dataSource={runs || []}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    loading={isLoading}
                    className="custom-table"
                    locale={{ emptyText: 'No payroll runs found' }}
                />
            </Card>

            <Modal
                title="Initiate Payroll Run"
                open={isModalOpen}
                onOk={handleInitiate}
                onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
                okText="Start Processing"
                confirmLoading={initiateRunMutation.isPending}
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item name="month" label="Select Month" rules={[{ required: true }]}>
                        <DatePicker picker="month" className="w-full" />
                    </Form.Item>

                    <div className="flex flex-col gap-2 bg-[#0f172a] border border-slate-200 p-4 rounded-md text-sm text-slate-600 mt-4">
                        <h4 className="text-slate-900 font-medium mb-1 dark:text-gray-200">Pre-processing Checklist</h4>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> All attendance records regularized</div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Leave requests approved/rejected</div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Tax declarations updated</div>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
