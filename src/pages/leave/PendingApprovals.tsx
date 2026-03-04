import { Typography, Card, Button, Table, Row, Col, Statistic, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function PendingApprovals() {
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const queryClient = useQueryClient();

    // Fetch Pending Approvals
    const { data: requests, isLoading } = useQuery({
        queryKey: ['leave', 'pending-approvals'],
        queryFn: async () => {
            const res = await apiClient.get('/leave/pending-approvals');
            return res.data;
        }
    });

    // Decide Leave Mutation
    const decideMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const res = await apiClient.patch(`/leave/${id}/decide`, { status });
            return res.data;
        },
        onSuccess: (data, variables) => {
            message.success(`Leave request ${variables.status.toLowerCase()} successfully`);
            queryClient.invalidateQueries({ queryKey: ['leave', 'pending-approvals'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to process request');
        }
    });

    const handleApprove = (id: string) => {
        decideMutation.mutate({ id, status: 'APPROVED' });
    };

    const handleReject = (id: string) => {
        decideMutation.mutate({ id, status: 'REJECTED' });
    };

    const handleBulkApprove = async () => {
        try {
            await Promise.all(
                selectedRowKeys.map(id => apiClient.patch(`/leave/${id}/decide`, { status: 'APPROVED' }))
            );
            message.success(`Approved ${selectedRowKeys.length} leave requests`);
            setSelectedRowKeys([]);
            queryClient.invalidateQueries({ queryKey: ['leave', 'pending-approvals'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        } catch (error: any) {
            message.error('Failed to process some requests');
        }
    };

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    const columns = [
        {
            title: 'Employee',
            dataIndex: ['employee'],
            key: 'employee',
            className: 'font-medium',
            render: (employee: any) => employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown'
        },
        {
            title: 'Type',
            dataIndex: ['leaveType', 'name'],
            key: 'type',
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
        { title: 'Reason', dataIndex: 'reason', key: 'reason', render: (text: string) => <Text className="text-slate-500">{text}</Text> },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any) => (
                <div className="flex gap-2">
                    <Button
                        type="primary"
                        size="small"
                        icon={<CheckOutlined />}
                        className="bg-green-600 hover:bg-green-500"
                        onClick={() => handleApprove(record.id)}
                        loading={decideMutation.isPending && decideMutation.variables?.id === record.id && decideMutation.variables?.status === 'APPROVED'}
                    >
                        Approve
                    </Button>
                    <Button
                        size="small"
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => handleReject(record.id)}
                        loading={decideMutation.isPending && decideMutation.variables?.id === record.id && decideMutation.variables?.status === 'REJECTED'}
                    >
                        Reject
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div>
                    <Title level={3} className="!mb-1">Pending Approvals</Title>
                    <Text className="text-slate-500">Review and approve leave requests from your team.</Text>
                </div>
                {selectedRowKeys.length > 0 && (
                    <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        className="bg-green-600 hover:bg-green-500"
                        onClick={handleBulkApprove}
                    >
                        Approve Selected ({selectedRowKeys.length})
                    </Button>
                )}
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card bordered={false} className="shadow-sm border-t-2 bg-slate-50 border-t-brand-red">
                        <Statistic title={<span className="text-slate-500">Total Pending</span>} value={requests?.length || 0} valueStyle={{ color: '#0f172a' }} loading={isLoading} />
                    </Card>
                </Col>
            </Row>

            <Card bordered={false} className="shadow-sm">
                <Table
                    rowSelection={rowSelection}
                    columns={columns}
                    dataSource={requests || []}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    loading={isLoading}
                    className="custom-table"
                    locale={{ emptyText: 'No pending approvals' }}
                />
            </Card>
        </div>
    );
}
