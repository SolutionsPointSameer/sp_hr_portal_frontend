import { useMemo, useState } from 'react';
import {
    Button,
    Card,
    Form,
    Input,
    InputNumber,
    Modal,
    Switch,
    Table,
    Tag,
    Typography,
    message
} from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

const { Title, Text } = Typography;

interface LeaveTypeRecord {
    id: string;
    name: string;
    annualQuota: number;
    carryForwardLimit: number;
    isPaid: boolean;
}

interface LeaveTypeFormValues {
    name: string;
    annualQuota: number;
    carryForwardLimit: number;
    isPaid: boolean;
}

export default function ConfigureLeaveTypes() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLeaveType, setEditingLeaveType] = useState<LeaveTypeRecord | null>(null);
    const [form] = Form.useForm<LeaveTypeFormValues>();
    const queryClient = useQueryClient();

    const leaveTypesQuery = useQuery({
        queryKey: ['leave', 'types'],
        queryFn: async () => {
            const response = await apiClient.get('/leave/types');
            return response.data as LeaveTypeRecord[];
        }
    });

    const createLeaveTypeMutation = useMutation({
        mutationFn: async (values: LeaveTypeFormValues) => {
            const response = await apiClient.post('/leave/types', {
                ...values,
                name: values.name.trim()
            });
            return response.data;
        },
        onSuccess: () => {
            message.success('Leave type created successfully');
            closeModal();
            queryClient.invalidateQueries({ queryKey: ['leave', 'types'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || error.response?.data?.error || 'Failed to create leave type');
        }
    });

    const updateLeaveTypeMutation = useMutation({
        mutationFn: async (values: LeaveTypeFormValues) => {
            if (!editingLeaveType) {
                throw new Error('Missing leave type to update');
            }
            const response = await apiClient.patch(`/leave/types/${editingLeaveType.id}`, {
                ...values,
                name: values.name.trim()
            });
            return response.data;
        },
        onSuccess: () => {
            message.success('Leave type updated successfully');
            closeModal();
            queryClient.invalidateQueries({ queryKey: ['leave', 'types'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || error.response?.data?.error || 'Failed to update leave type');
        }
    });

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingLeaveType(null);
        form.resetFields();
    };

    const openCreateModal = () => {
        setEditingLeaveType(null);
        form.resetFields();
        form.setFieldsValue({
            annualQuota: 12,
            carryForwardLimit: 0,
            isPaid: true
        });
        setIsModalOpen(true);
    };

    const openEditModal = (record: LeaveTypeRecord) => {
        setEditingLeaveType(record);
        form.setFieldsValue({
            name: record.name,
            annualQuota: record.annualQuota,
            carryForwardLimit: record.carryForwardLimit,
            isPaid: record.isPaid
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();
        if (editingLeaveType) {
            updateLeaveTypeMutation.mutate(values);
            return;
        }
        createLeaveTypeMutation.mutate(values);
    };

    const summary = useMemo(() => {
        const leaveTypes = leaveTypesQuery.data ?? [];
        return {
            total: leaveTypes.length,
            paid: leaveTypes.filter((item) => item.isPaid).length,
            unpaid: leaveTypes.filter((item) => !item.isPaid).length,
            highestQuota: leaveTypes.reduce((max, item) => Math.max(max, item.annualQuota), 0)
        };
    }, [leaveTypesQuery.data]);

    const columns = [
        {
            title: 'Leave Type',
            dataIndex: 'name',
            key: 'name',
            className: 'font-medium'
        },
        {
            title: 'Annual Quota',
            dataIndex: 'annualQuota',
            key: 'annualQuota',
            render: (value: number) => `${value} days`
        },
        {
            title: 'Carry Forward',
            dataIndex: 'carryForwardLimit',
            key: 'carryForwardLimit',
            render: (value: number) => `${value} days`
        },
        {
            title: 'Compensation',
            dataIndex: 'isPaid',
            key: 'isPaid',
            render: (value: boolean) => (
                <Tag color={value ? 'green' : 'default'}>{value ? 'PAID' : 'UNPAID'}</Tag>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 140,
            render: (_: unknown, record: LeaveTypeRecord) => (
                <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
                    Edit
                </Button>
            )
        }
    ];

    return (
        <div className="p-4 sm:p-8 space-y-8 animate-fade-in max-w-[1400px] mx-auto">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <Title level={2} className="!mb-1 page-heading" style={{ color: '#26428b' }}>
                        Configure Leave Types
                    </Title>
                    <Text className="text-slate-500">
                        Define quotas, carry-forward rules, and whether each leave type is paid.
                    </Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} className="bg-[#e00c05] hover:bg-[#c00a04]">
                    Add Leave Type
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card bordered={false} className="shadow-sm">
                    <Text className="text-slate-500 text-xs uppercase tracking-wide">Total Types</Text>
                    <Title level={3} className="!mb-0 !mt-2">{summary.total}</Title>
                </Card>
                <Card bordered={false} className="shadow-sm">
                    <Text className="text-slate-500 text-xs uppercase tracking-wide">Paid Types</Text>
                    <Title level={3} className="!mb-0 !mt-2">{summary.paid}</Title>
                </Card>
                <Card bordered={false} className="shadow-sm">
                    <Text className="text-slate-500 text-xs uppercase tracking-wide">Unpaid Types</Text>
                    <Title level={3} className="!mb-0 !mt-2">{summary.unpaid}</Title>
                </Card>
                <Card bordered={false} className="shadow-sm">
                    <Text className="text-slate-500 text-xs uppercase tracking-wide">Highest Quota</Text>
                    <Title level={3} className="!mb-0 !mt-2">{summary.highestQuota} days</Title>
                </Card>
            </div>

            <Card bordered={false} className="shadow-xl border-slate-100 rounded-2xl">
                <Table
                    columns={columns}
                    dataSource={leaveTypesQuery.data || []}
                    rowKey="id"
                    loading={leaveTypesQuery.isLoading}
                    pagination={{ pageSize: 10, size: 'small' }}
                    className="custom-table"
                    locale={{ emptyText: 'No leave types configured yet.' }}
                />
            </Card>

            <Modal
                title={editingLeaveType ? 'Edit Leave Type' : 'Add Leave Type'}
                open={isModalOpen}
                onOk={handleSubmit}
                onCancel={closeModal}
                okText={editingLeaveType ? 'Save Changes' : 'Create Leave Type'}
                confirmLoading={createLeaveTypeMutation.isPending || updateLeaveTypeMutation.isPending}
            >
                <Form form={form} layout="vertical" size="large" className="mt-4">
                    <Form.Item
                        name="name"
                        label="Leave Type Name"
                        rules={[{ required: true, message: 'Please enter leave type name' }]}
                    >
                        <Input placeholder="e.g. Sick Leave" />
                    </Form.Item>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Form.Item
                            name="annualQuota"
                            label="Annual Quota"
                            rules={[{ required: true, message: 'Please enter annual quota' }]}
                        >
                            <InputNumber className="w-full" min={0} max={365} addonAfter="days" />
                        </Form.Item>
                        <Form.Item
                            name="carryForwardLimit"
                            label="Carry Forward Limit"
                            rules={[{ required: true, message: 'Please enter carry forward limit' }]}
                        >
                            <InputNumber className="w-full" min={0} max={365} addonAfter="days" />
                        </Form.Item>
                    </div>
                    <Form.Item
                        name="isPaid"
                        label="Paid Leave"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="Paid" unCheckedChildren="Unpaid" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
