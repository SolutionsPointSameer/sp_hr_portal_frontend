import { Drawer, Typography, List, Checkbox, Button, Collapse, Spin, message, Tag } from 'antd';
import { DownloadOutlined, EyeOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Panel } = Collapse;

interface OnboardingChecklistDrawerProps {
    open: boolean;
    onClose: () => void;
    employee: any;
}

export default function OnboardingChecklistDrawer({ open, onClose, employee }: OnboardingChecklistDrawerProps) {
    const queryClient = useQueryClient();

    // Fetch Tasks for this specific employee
    const { data: tasks, isLoading: tasksLoading } = useQuery({
        queryKey: ['onboarding', 'tasks', employee?.id],
        queryFn: async () => {
            if (!employee?.id) return [];
            const res = await apiClient.get('/onboarding/tasks');
            // Filter tasks for this employee specifically (since backend doesn't have a direct /employees/:id/tasks route yet)
            return res.data.filter((t: any) => t.employeeId === employee.id);
        },
        enabled: !!employee?.id,
    });

    // Fetch Uploaded Documents
    // Mocking the response currently as backend API is pending
    const { data: documents, isLoading: docsLoading } = useQuery({
        queryKey: ['employees', employee?.id, 'documents'],
        queryFn: async () => {
            if (!employee?.id) return [];
            // Simulate network delay
            await new Promise(r => setTimeout(r, 800));
            // Return mock data for Aadhaar and PAN
            return [
                { id: '1', type: 'Aadhaar Card', fileName: 'aadhaar_front_back.pdf', url: '#' },
                { id: '2', type: 'PAN Card', fileName: 'pan_card.jpg', url: '#' },
            ];
        },
        enabled: !!employee?.id,
    });

    // Update Task Status Mutation
    const updateTaskStatusMutation = useMutation({
        mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
            const res = await apiClient.patch(`/onboarding/tasks/${taskId}/status`, { status });
            return res.data;
        },
        onSuccess: () => {
            message.success('Task status updated');
            queryClient.invalidateQueries({ queryKey: ['onboarding', 'tasks', employee?.id] });
            queryClient.invalidateQueries({ queryKey: ['onboarding', 'tasks'] }); // Invalidate global list too
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to update task');
        }
    });

    const handleTaskToggle = (taskId: string, checked: boolean) => {
        updateTaskStatusMutation.mutate({
            taskId,
            status: checked ? 'COMPLETED' : 'PENDING'
        });
    };

    if (!employee) return null;

    const completedCount = tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
    const totalCount = tasks?.length || 0;
    const isOverdue = tasks?.some((t: any) => t.status !== 'COMPLETED' && dayjs(t.dueDate).isBefore(dayjs(), 'day'));

    return (
        <Drawer
            title={
                <div>
                    <span className="text-slate-800 text-lg">{employee.name}</span>
                    <br />
                    <span className="text-slate-500 font-normal text-sm">Onboarding Profile</span>
                </div>
            }
            placement="right"
            width={500}
            onClose={onClose}
            open={open}
            className="custom-drawer"
        >
            <div className="flex flex-col gap-6">

                {/* Status Summary Banner */}
                <div className={`p-4 rounded-lg flex items-center gap-3 ${isOverdue ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {isOverdue ? <WarningOutlined className="text-xl" /> : <CheckCircleOutlined className="text-xl" />}
                    <div>
                        <div className="font-semibold">{isOverdue ? 'Tasks Overdue' : 'On Track'}</div>
                        <div className="text-sm opacity-90">{completedCount} of {totalCount} assigned tasks completed</div>
                    </div>
                </div>

                {/* Section 1: Uploaded Documents */}
                <section>
                    <Title level={5} className="!mb-4 text-slate-800 border-b border-slate-200 pb-2">Uploaded Documents</Title>
                    {docsLoading ? (
                        <div className="flex justify-center p-8"><Spin /></div>
                    ) : documents && documents.length > 0 ? (
                        <List
                            itemLayout="horizontal"
                            dataSource={documents}
                            className="bg-white border text-sm border-slate-200 rounded-lg overflow-hidden"
                            renderItem={(doc: any) => (
                                <List.Item
                                    className="px-4 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                                    actions={[
                                        <Button type="text" size="small" icon={<EyeOutlined />} className="text-brand-red">View</Button>,
                                        <Button type="text" size="small" icon={<DownloadOutlined />} className="text-slate-500">Download</Button>
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={<span className="font-medium text-slate-800">{doc.type}</span>}
                                        description={<span className="text-xs text-slate-500">{doc.fileName}</span>}
                                    />
                                    <Tag color="green" className="ml-2">Verified</Tag>
                                </List.Item>
                            )}
                        />
                    ) : (
                        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-6 text-center text-slate-500">
                            No documents uploaded yet.
                        </div>
                    )}
                </section>

                {/* Section 2: Task Checklist */}
                <section>
                    <Title level={5} className="!mb-4 text-slate-800 border-b border-slate-200 pb-2">Task Checklist</Title>
                    {tasksLoading ? (
                        <div className="flex justify-center p-8"><Spin /></div>
                    ) : tasks && tasks.length > 0 ? (
                        <Collapse defaultActiveKey={['1']} ghost className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                            <Panel header={<span className="font-medium text-slate-800">Assigned Tasks ({totalCount})</span>} key="1" className="border-b-0">
                                <List
                                    itemLayout="horizontal"
                                    dataSource={tasks}
                                    renderItem={(task: any) => {
                                        const isCompleted = task.status === 'COMPLETED';
                                        const isTaskOverdue = !isCompleted && dayjs(task.dueDate).isBefore(dayjs(), 'day');
                                        return (
                                            <List.Item className="px-2 border-b border-slate-100 last:border-0">
                                                <div className="flex items-start gap-3 w-full">
                                                    <Checkbox
                                                        checked={isCompleted}
                                                        onChange={(e) => handleTaskToggle(task.id, e.target.checked)}
                                                        disabled={updateTaskStatusMutation.isPending && updateTaskStatusMutation.variables?.taskId === task.id}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1">
                                                        <div className={`font-medium ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                                            {task.title}
                                                        </div>
                                                        <div className="text-xs flex gap-2 mt-1">
                                                            <span className="text-slate-500 flex items-center gap-1">
                                                                Assigned to: {task.assignedTo?.firstName || 'Self'}
                                                            </span>
                                                            <span className="text-slate-300">|</span>
                                                            <span className={isTaskOverdue ? 'text-red-600 font-medium' : 'text-slate-500'}>
                                                                Due: {dayjs(task.dueDate).format('MMM D, YYYY')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </List.Item>
                                        );
                                    }}
                                />
                            </Panel>
                        </Collapse>
                    ) : (
                        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-6 text-center text-slate-500">
                            No tasks assigned yet.
                        </div>
                    )}
                </section>

            </div>

            <div className="absolute bottom-0 left-0 w-full p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <Button onClick={onClose}>Close</Button>
                <Button type="primary" onClick={() => message.info('Triggering manual welcome email...')}>Send Welcome Nudge</Button>
            </div>
        </Drawer>
    );
}
