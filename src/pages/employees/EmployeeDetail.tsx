import { Descriptions, Card, Tabs, Tag, Button, Typography, Avatar, Spin, message } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
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
        { label: 'Company', children: employee.company?.name || '-' },
        { label: 'Location', children: employee.location?.name || '-' },
        { label: 'Department', children: employee.department?.name || '-' },
        { label: 'Designation', children: employee.designation?.name || '-' },
        { label: 'Reporting Manager', children: managerName },
    ];

    if (canEdit) {
        workItems.push({ label: 'CTC (Monthly)', children: employee.ctc ? `₹${employee.ctc}` : '-' });
        workItems.push({ label: 'In-Hand Salary (Monthly)', children: employee.inHandSalary ? `₹${employee.inHandSalary}` : '-' });
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/employees')}
                        className="text-slate-500 hover:text-slate-900"
                    >
                        Back
                    </Button>
                </div>
                {canEdit && (
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/employees/${id}/edit`)}
                    >
                        Edit Profile
                    </Button>
                )}
            </div>

            <Card bordered={false} className="shadow-sm">
                <div className="flex items-center gap-6 mb-8">
                    <Avatar
                        size={80}
                        className="bg-brand-red flex-shrink-0 text-2xl font-bold"
                        style={{ backgroundColor: '#dc2626' }}
                    >
                        {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Title level={4} className="!mb-0">{employee.firstName} {employee.lastName}</Title>
                            <Tag color="default" className="border-none bg-slate-100 text-slate-600 font-mono text-xs">
                                {employee.employeeCode}
                            </Tag>
                        </div>
                        <div className="text-slate-500 mt-1">
                            {employee.designation?.name || '-'} &bull; {employee.department?.name || '-'}
                        </div>
                        <Tag
                            color={employee.status === 'ACTIVE' ? 'success' : employee.status === 'TERMINATED' ? 'error' : 'warning'}
                            className="border-none mt-2 text-xs"
                        >
                            {employee.status?.replace('_', ' ')}
                        </Tag>
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
                        <div className="py-4">
                            {canEdit ? (
                                <EmployeeDocuments employeeId={id!} />
                            ) : (
                                <div className="text-slate-500 italic">
                                    You do not have permission to view documents.
                                </div>
                            )}
                        </div>
                    </Tabs.TabPane>
                </Tabs>
            </Card>
        </div>
    );
}

function EmployeeDocuments({ employeeId }: { employeeId: string }) {
    const { data: documents, isLoading, isError } = useQuery({
        queryKey: ['employee-documents', employeeId],
        queryFn: async () => {
            const res = await apiClient.get(`/employees/${employeeId}/documents`);
            return res.data;
        },
    });

    if (isLoading) {
        return <div className="flex justify-center p-8"><Spin /></div>;
    }

    if (isError) {
        return <div className="text-red-500">Failed to load documents.</div>;
    }

    if (!documents || documents.length === 0) {
        return <div className="text-slate-500 italic">No documents uploaded yet.</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc: any) => (
                <Card key={doc.id} size="small" className="border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <div className="font-medium text-slate-900">{doc.type.replace(/_/g, ' ')}</div>
                                <div className="text-xs text-slate-500">
                                    Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {doc.viewUrl && (
                                <Button
                                    type="text"
                                    size="small"
                                    className="text-brand-blue hover:text-blue-700"
                                    onClick={() => window.open(doc.viewUrl, '_blank')}
                                >
                                    View
                                </Button>
                            )}
                            {doc.fileUrl && (
                                <Button
                                    type="text"
                                    size="small"
                                    className="text-slate-600 hover:text-slate-900"
                                    onClick={() => window.open(doc.fileUrl, '_blank')}
                                >
                                    Download
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
