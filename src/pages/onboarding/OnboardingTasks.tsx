import { Typography, Card, Button, Table, Tabs, Progress, Avatar, Modal, Form, Select, DatePicker, message } from 'antd';
import { PlusOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import dayjs from 'dayjs';
import OnboardingChecklistDrawer from './OnboardingChecklistDrawer';

const { Title, Text } = Typography;
const { Option } = Select;

export default function OnboardingTasks() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    // Fetch Employees (for dropdown)
    const { data: employeesData } = useQuery({
        queryKey: ['employees', { limit: 100 }],
        queryFn: async () => {
            const res = await apiClient.get('/employees?limit=100');
            return res.data;
        }
    });

    const employees = employeesData?.data || [];

    // Fetch Onboarding Tasks
    const { data: tasks, isLoading } = useQuery({
        queryKey: ['onboarding', 'tasks'],
        queryFn: async () => {
            const res = await apiClient.get('/onboarding/tasks');
            return res.data;
        }
    });

    // Create Task Mutation
    const createTaskMutation = useMutation({
        mutationFn: async (values: any) => {
            const payload = {
                employeeId: values.employeeId,
                title: values.taskName.join(', '), // Assuming multiple tags can be selected or just a string
                description: 'Assigned via Portal',
                dueDate: values.dueDate.format('YYYY-MM-DD')
            };
            const res = await apiClient.post('/onboarding/tasks', payload);
            return res.data;
        },
        onSuccess: () => {
            message.success('Onboarding task created and assigned successfully.');
            setIsModalOpen(false);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['onboarding', 'tasks'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to create task');
        }
    });

    // Update Task Status Mutation
    const updateTaskStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const res = await apiClient.patch(`/onboarding/tasks/${id}/status`, { status });
            return res.data;
        },
        onSuccess: () => {
            message.success('Task status updated');
            queryClient.invalidateQueries({ queryKey: ['onboarding', 'tasks'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to update task');
        }
    });

    const handleCreateTask = () => {
        form.validateFields().then(values => {
            createTaskMutation.mutate(values);
        });
    };

    const handleResolveTask = (id: string) => {
        updateTaskStatusMutation.mutate({ id, status: 'COMPLETED' });
    };

    // Calculate derived data
    const activeTasks = tasks?.filter((t: any) => t.status === 'PENDING') || [];
    const overdueTasks = activeTasks.filter((t: any) => dayjs(t.dueDate).isBefore(dayjs(), 'day'));

    // Group tasks by employee to show progress
    const employeeProgress = employees.map((emp: any) => {
        const empTasks = tasks?.filter((t: any) => t.employeeId === emp.id) || [];
        const total = empTasks.length;
        const completed = empTasks.filter((t: any) => t.status === 'COMPLETED').length;
        return {
            id: emp.id,
            name: `${emp.firstName} ${emp.lastName}`,
            role: emp.designation?.name || 'Employee',
            joining: dayjs(emp.joiningDate).format('YYYY-MM-DD'),
            progress: total > 0 ? Math.round((completed / total) * 100) : 0,
            hasTasks: total > 0
        };
    }).filter((emp: any) => emp.hasTasks); // Only show employees with assigned tasks

    const activeColumns = [
        {
            title: 'New Hire',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, record: any) => (
                <div className="flex items-center gap-3">
                    <Avatar icon={<UserOutlined />} className="bg-brand-red" />
                    <div>
                        <div className="font-medium text-slate-900">{name}</div>
                        <div className="text-xs text-slate-500">{record.role}</div>
                    </div>
                </div>
            )
        },
        { title: 'Joining Date', dataIndex: 'joining', key: 'joining' },
        {
            title: 'Onboarding Progress',
            dataIndex: 'progress',
            key: 'progress',
            render: (percent: number) => (
                <div className="w-48">
                    <Progress percent={percent} size="small" strokeColor="#E00C05" trailColor="#1e293b" />
                </div>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: any) => (
                <Button
                    type="link"
                    size="small"
                    onClick={() => {
                        setSelectedEmployee(record);
                        setIsDrawerOpen(true);
                    }}
                >
                    Verify & View Checklist
                </Button>
            )
        }
    ];

    const taskColumns = [
        { title: 'Task Description', dataIndex: 'title', key: 'title', className: 'font-medium' },
        {
            title: 'New Hire',
            dataIndex: ['employee'],
            key: 'employee',
            render: (emp: any) => emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown'
        },
        {
            title: 'Due Date',
            dataIndex: 'dueDate',
            key: 'dueDate',
            className: 'text-brand-red font-medium',
            render: (date: string) => dayjs(date).format('YYYY-MM-DD')
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status'
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: any) => (
                <div className="flex gap-2">
                    {record.status !== 'COMPLETED' && (
                        <Button
                            size="small"
                            type="primary"
                            className="bg-green-600 hover:bg-green-500"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleResolveTask(record.id)}
                            loading={updateTaskStatusMutation.isPending && updateTaskStatusMutation.variables?.id === record.id}
                        >
                            Resolve
                        </Button>
                    )}
                    <Button size="small" type="default" className="text-slate-600 border-slate-300 hover:border-slate-400">Nudge</Button>
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div>
                    <Title level={3} className="!mb-1">Onboarding Center</Title>
                    <Text className="text-slate-500">Track and manage checklists for new joiners.</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalOpen(true)}
                >
                    Create Task
                </Button>
            </div>

            <Card bordered={false} className="shadow-sm p-2">
                <Tabs defaultActiveKey="1">
                    <Tabs.TabPane tab={<span>Active Onboarding <span className="ml-1 bg-brand-red/20 text-brand-red px-2 py-0.5 rounded-full text-xs">{employeeProgress.length}</span></span>} key="1">
                        <Table
                            columns={activeColumns}
                            dataSource={employeeProgress}
                            rowKey="id"
                            pagination={false}
                            className="custom-table mt-4"
                            loading={isLoading}
                        />
                    </Tabs.TabPane>
                    <Tabs.TabPane tab={<span>Overdue Tasks <span className="ml-1 bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full text-xs">{overdueTasks.length}</span></span>} key="2">
                        <Table
                            columns={taskColumns}
                            dataSource={overdueTasks}
                            rowKey="id"
                            pagination={false}
                            className="custom-table mt-4"
                            loading={isLoading}
                        />
                    </Tabs.TabPane>
                    <Tabs.TabPane tab={<span>All Tasks</span>} key="3">
                        <Table
                            columns={taskColumns}
                            dataSource={tasks || []}
                            rowKey="id"
                            pagination={{ pageSize: 10 }}
                            className="custom-table mt-4"
                            loading={isLoading}
                        />
                    </Tabs.TabPane>
                </Tabs>
            </Card>

            <Modal
                title="Create Onboarding Task"
                open={isModalOpen}
                onOk={handleCreateTask}
                onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
                okText="Assign Task"
                confirmLoading={createTaskMutation.isPending}
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item name="employeeId" label="Select New Hire" rules={[{ required: true }]}>
                        <Select placeholder="Search employee..." showSearch optionFilterProp="children">
                            {employees.map((h: any) => <Option key={h.id} value={h.id}>{h.firstName} {h.lastName}</Option>)}
                        </Select>
                    </Form.Item>

                    <Form.Item name="taskName" label="Task Description" rules={[{ required: true }]}>
                        <Select placeholder="E.g. Background Verification" mode="tags">
                            <Option value="Background Verification">Background Verification</Option>
                            <Option value="IT Asset Allocation">IT Asset Allocation</Option>
                            <Option value="Document Submission">Document Submission</Option>
                            <Option value="Payroll Setup">Payroll Setup</Option>
                            <Option value="Induction Session">Induction Session</Option>
                        </Select>
                    </Form.Item>

                    <div className="flex gap-4">
                        <Form.Item name="assignedTo" label="Assign To" className="flex-1" rules={[{ required: true }]} initialValue="self">
                            <Select placeholder="Assignee">
                                <Option value="self">Self (New Hire)</Option>
                                <Option value="hr">HR Team</Option>
                                <Option value="it">IT Support</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item name="dueDate" label="Due Date" className="flex-1" rules={[{ required: true }]}>
                            <DatePicker className="w-full" />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>

            {/* Check/Verify Drawer */}
            <OnboardingChecklistDrawer
                open={isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setSelectedEmployee(null);
                }}
                employee={selectedEmployee}
            />
        </div>
    );
}
