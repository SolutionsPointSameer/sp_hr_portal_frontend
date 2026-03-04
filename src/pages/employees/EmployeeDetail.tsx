import { Descriptions, Card, Tabs, Tag, Button, Typography, Avatar, Spin, message } from 'antd';
import { UserOutlined, ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

const { Title } = Typography;

export default function EmployeeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);

    const canEdit = user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN';

    const { data: employee, isLoading, isError } = useQuery({
        queryKey: ['employee', id],
        queryFn: async () => {
            if (id === 'new') return null; // Edge case if 'new' routes here by mistake
            const res = await apiClient.get(`/employees/${id}`);
            return res.data;
        },
        enabled: !!id && id !== 'new',
    });

    if (isError) {
        message.error('Failed to load employee details');
        navigate('/employees');
        return null;
    }

    if (isLoading) {
        return <div className="flex justify-center p-12"><Spin size="large" /></div>;
    }

    if (!employee) {
        return <div className="p-12 text-center text-slate-500">Employee not found.</div>;
    }

    const joiningDateStr = employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : '-';
    const managerName = employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : 'None';

    const profileItems = [
        { label: 'Employee Code', children: employee.employeeCode },
        { label: 'Email', children: employee.email },
        { label: 'Phone', children: employee.phone || '-' },
        { label: 'Joining Date', children: joiningDateStr },
        { label: 'Status', children: <Tag color={employee.status === 'ACTIVE' ? 'success' : 'warning'}>{employee.status?.replace('_', ' ')}</Tag> },
        { label: 'Type', children: employee.employmentType?.replace('_', ' ') || '-' },
    ];

    const workItems = [
        { label: 'Department', children: employee.department?.name || '-' },
        { label: 'Designation', children: employee.designation?.name || '-' },
        { label: 'Reporting Manager', children: managerName },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/employees')}
                        className="text-slate-500 hover:text-slate-900"
                    />
                    <Title level={3} className="!mb-0">Employee Profile</Title>
                </div>
                {canEdit && (
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/employees/${id}/edit`)}
                        className="bg-slate-100 border-none text-slate-900 hover:bg-slate-200"
                    >
                        Edit Profile
                    </Button>
                )}
            </div>

            <Card bordered={false} className="shadow-sm">
                <div className="flex items-center gap-6 mb-8">
                    <Avatar size={80} icon={<UserOutlined />} className="bg-brand-red" />
                    <div>
                        <Title level={4} className="!mb-1">{employee.firstName} {employee.lastName}</Title>
                        <div className="text-slate-500">{employee.designation?.name || '-'} • {employee.department?.name || '-'}</div>
                    </div>
                </div>

                <Tabs defaultActiveKey="1">
                    <Tabs.TabPane tab="Profile" key="1">
                        <div className="max-w-4xl py-4">
                            <Descriptions
                                bordered
                                column={{ xs: 1, sm: 2 }}
                                items={profileItems}
                                className="bg-white rounded-lg overflow-hidden"
                                labelStyle={{ background: '#f8fafc', color: '#64748b', fontWeight: 500 }}
                                contentStyle={{ background: '#ffffff', color: '#0f172a' }}
                            />
                        </div>
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Employment" key="2">
                        <div className="max-w-4xl py-4">
                            <Descriptions
                                bordered
                                column={1}
                                items={workItems}
                                className="bg-white rounded-lg overflow-hidden"
                                labelStyle={{ background: '#f8fafc', color: '#64748b', fontWeight: 500, width: '200px' }}
                                contentStyle={{ background: '#ffffff', color: '#0f172a' }}
                            />
                        </div>
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Documents" key="3">
                        <div className="py-4 text-slate-500 italic">
                            No documents uploaded yet.
                        </div>
                    </Tabs.TabPane>
                </Tabs>
            </Card>
        </div>
    );
}
