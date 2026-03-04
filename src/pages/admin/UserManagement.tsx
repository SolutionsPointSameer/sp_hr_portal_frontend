import { Typography, Card, Table, Button, Tag, Switch, Input, Popconfirm, message } from 'antd';
import { SearchOutlined, MailOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';

const { Title, Text } = Typography;

interface User {
    id: string;
    code: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/users');
            setUsers(response.data);
        } catch (error) {
            message.error('Failed to fetch users');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleUserStatus = async (id: string, checked: boolean) => {
        try {
            await apiClient.patch(`/users/${id}/status`, { active: checked });
            setUsers(users.map(u => u.id === id ? { ...u, active: checked } : u));
            message.success(`User set to ${checked ? 'Active' : 'Deactivated'}`);
        } catch (error) {
            message.error('Failed to update user status');
            console.error(error);
        }
    };

    const handlePasswordReset = async (id: string, email: string) => {
        try {
            await apiClient.post(`/users/${id}/reset-password`);
            message.success(`Password reset email sent to ${email}`);
        } catch (error) {
            message.error('Failed to send password reset email');
            console.error(error);
        }
    };

    const columns = [
        { title: 'Code', dataIndex: 'code', key: 'code', className: 'font-mono text-slate-600' },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            className: 'font-medium',
        },
        { title: 'Email', dataIndex: 'email', key: 'email', className: 'text-slate-500' },
        {
            title: 'System Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => {
                let color = 'default';
                if (role === 'SUPER_ADMIN') color = 'magenta';
                if (role === 'HR_ADMIN') color = 'purple';
                if (role === 'MANAGER') color = 'blue';
                return <Tag color={color} className="border-none">{role?.replace('_', ' ')}</Tag>;
            }
        },
        {
            title: 'Status',
            key: 'active',
            render: (_: any, record: User) => (
                <Switch
                    checked={record.active}
                    onChange={(checked) => toggleUserStatus(record.id, checked)}
                    checkedChildren="Active"
                    unCheckedChildren="Inactive"
                />
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: User) => (
                <Popconfirm
                    title="Reset Password"
                    description="Are you sure you want to send a password reset link to this user?"
                    onConfirm={() => handlePasswordReset(record.id, record.email)}
                    okText="Yes"
                    cancelText="No"
                >
                    <Button size="small" icon={<MailOutlined />} className="text-slate-500 hover:text-slate-900 border-slate-300 hover:border-slate-400">
                        Reset Password
                    </Button>
                </Popconfirm>
            )
        }
    ];

    const filteredData = users.filter(u =>
        u.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div>
                    <Title level={3} className="!mb-1">User Management</Title>
                    <Text className="text-slate-500">Control system access, roles, and account security.</Text>
                </div>
            </div>

            <Card bordered={false} className="shadow-sm">
                <div className="mb-4 flex gap-4 md:w-1/2">
                    <Input
                        placeholder="Search by User Name or Email"
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        className="bg-white border-slate-200 text-slate-900"
                    />
                </div>
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                    pagination={false}
                    loading={loading}
                    className="custom-table"
                />
            </Card>
        </div>
    );
}
