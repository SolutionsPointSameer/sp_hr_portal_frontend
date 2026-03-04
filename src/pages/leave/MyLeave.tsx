import { Typography, Card, Button, Table, Row, Col, Statistic, Tag, Modal, Form, Select, DatePicker, Input, message } from 'antd';
import { PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

export default function MyLeave() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    // Fetch Leave Balances
    const { data: balances, isLoading: isLoadingBalances } = useQuery({
        queryKey: ['leave', 'balances'],
        queryFn: async () => {
            const res = await apiClient.get('/leave/my-balances');
            return res.data;
        }
    });

    // Fetch Leave Types
    const { data: leaveTypes, isLoading: isLoadingTypes } = useQuery({
        queryKey: ['leave', 'types'],
        queryFn: async () => {
            const res = await apiClient.get('/leave/types');
            return res.data;
        }
    });

    // Fetch My Leave Requests
    const { data: leaveRequests, isLoading: isLoadingRequests } = useQuery({
        queryKey: ['leave', 'mine'],
        queryFn: async () => {
            const res = await apiClient.get('/leave/mine');
            return res.data;
        },
        retry: false // Don't retry if endpoint doesn't exist
    });

    // Apply Leave Mutation
    const applyLeaveMutation = useMutation({
        mutationFn: async (values: any) => {
            const [fromDate, toDate] = values.dateRange;

            // Calculate rough days count (excluding weekends would require more logic, but simple diff for now)
            // Or rely on backend to calculate. API doc mentions daysCount is required in body.
            const from = dayjs(fromDate);
            const to = dayjs(toDate);
            let daysCount = to.diff(from, 'day') + 1;

            // Simple weekend exclusion (very basic)
            let curr = from.clone();
            let count = 0;
            while (curr.isBefore(to) || curr.isSame(to, 'day')) {
                if (curr.day() !== 0 && curr.day() !== 6) count++;
                curr = curr.add(1, 'day');
            }
            daysCount = count > 0 ? count : 1; // Fallback

            const payload = {
                leaveTypeId: values.leaveTypeId,
                fromDate: from.format('YYYY-MM-DD'),
                toDate: to.format('YYYY-MM-DD'),
                daysCount,
                reason: values.reason
            };
            const res = await apiClient.post('/leave/apply', payload);
            return res.data;
        },
        onSuccess: () => {
            message.success('Leave request submitted successfully');
            setIsModalOpen(false);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['leave'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to submit leave request');
        }
    });

    const columns = [
        {
            title: 'Type',
            dataIndex: ['leaveType', 'name'],
            key: 'type',
            className: 'font-medium',
            render: (text: string, record: any) => text || record.leaveType?.name || 'Unknown'
        },
        {
            title: 'From',
            dataIndex: 'fromDate',
            key: 'fromDate',
            render: (text: string) => dayjs(text).format('YYYY-MM-DD')
        },
        {
            title: 'To',
            dataIndex: 'toDate',
            key: 'toDate',
            render: (text: string) => dayjs(text).format('YYYY-MM-DD')
        },
        { title: 'Days', dataIndex: 'daysCount', key: 'daysCount' },
        {
            title: 'Applied On',
            dataIndex: 'createdAt',
            key: 'createdAt',
            className: 'text-slate-500',
            render: (text: string) => dayjs(text).format('YYYY-MM-DD')
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'default';
                if (status === 'APPROVED') color = 'success';
                if (status === 'PENDING') color = 'warning';
                if (status === 'REJECTED') color = 'error';
                return <Tag color={color} className="border-none">{status}</Tag>;
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: any) => (
                record.status === 'PENDING' ?
                    <Button danger type="link" size="small">Cancel</Button> : null
            )
        }
    ];

    const handleOk = () => {
        form.validateFields().then(values => {
            applyLeaveMutation.mutate(values);
        });
    };

    // Color mapping for leave types
    const getColorForLeaveType = (name: string, index: number) => {
        const colors = ['blue', 'brand-red', 'green', 'orange', 'purple'];
        if (name?.toLowerCase().includes('sick')) return 'brand-red';
        if (name?.toLowerCase().includes('casual')) return 'green';
        return colors[index % colors.length];
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div>
                    <Title level={3} className="!mb-1">My Leaves</Title>
                    <Text className="text-slate-500">View balances and track your leave requests.</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalOpen(true)}
                >
                    Apply for Leave
                </Button>
            </div>

            <Row gutter={[16, 16]}>
                {balances?.map((balance: any, index: number) => {
                    const typeName = balance.leaveType?.name || 'Unknown';
                    const color = getColorForLeaveType(typeName, index);
                    return (
                        <Col xs={24} md={8} key={balance.id || index}>
                            <Card bordered={false} className={`shadow-sm border-t-2 bg-slate-50 border-t-${color}-500`}>
                                <div className="flex justify-between items-center mb-2">
                                    <Text className="text-slate-500 font-medium">{typeName}</Text>
                                    <Tag color="default" className="border-none bg-slate-100 text-slate-600">
                                        {balance.entitled} max
                                    </Tag>
                                </div>
                                <div className="flex gap-4">
                                    <Statistic title={<span className="text-xs text-slate-500">Remaining</span>} value={balance.remaining} valueStyle={{ color: '#0f172a', fontSize: '24px' }} />
                                    <Statistic title={<span className="text-xs text-slate-500">Used</span>} value={balance.used} valueStyle={{ color: '#475569', fontSize: '24px' }} />
                                </div>
                            </Card>
                        </Col>
                    );
                })}
                {balances?.length === 0 && (
                    <Col span={24}>
                        <Card bordered={false} className="shadow-sm bg-slate-50 text-center text-slate-500 py-8">
                            No leave balances found for current year.
                        </Card>
                    </Col>
                )}
            </Row>

            <Card title="My Leave Requests" bordered={false} className="shadow-sm">
                <Table
                    columns={columns}
                    dataSource={leaveRequests || []}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    loading={isLoadingRequests}
                    className="custom-table"
                    locale={{ emptyText: 'No leave requests found.' }}
                />
            </Card>

            <Modal
                title="Apply for Leave"
                open={isModalOpen}
                onOk={handleOk}
                onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
                okText="Submit Request"
                confirmLoading={applyLeaveMutation.isPending}
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item name="leaveTypeId" label="Leave Type" rules={[{ required: true }]}>
                        <Select placeholder="Select leave type" loading={isLoadingTypes}>
                            {leaveTypes?.map((l: any) => (
                                <Option key={l.id} value={l.id}>{l.name} ({l.isPaid ? 'Paid' : 'Unpaid'})</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="dateRange" label="Duration" rules={[{ required: true }]}>
                        <RangePicker className="w-full" disabledDate={(current) => current && current < dayjs().startOf('day')} />
                    </Form.Item>

                    <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
                        <TextArea rows={4} placeholder="Please provide a reason for your leave" />
                    </Form.Item>

                    <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-md text-sm text-slate-500 mt-2">
                        <InfoCircleOutlined className="mt-1" />
                        <p className="mb-0">Your request will be sent to your reporting manager for approval. You will be notified once a decision is made.</p>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
