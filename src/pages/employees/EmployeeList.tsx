import { Table, Button, Input, Select, Tag, Typography, Card } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

const { Title } = Typography;
const { Option } = Select;

export default function EmployeeList() {
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Fetch employees from API
    const { data: employeesData, isLoading } = useQuery({
        queryKey: ['employees', currentPage, pageSize, searchText, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: pageSize.toString(),
            });
            if (searchText) params.append('search', searchText);
            if (statusFilter !== 'All') params.append('status', statusFilter);

            const res = await apiClient.get(`/employees?${params.toString()}`);
            return res.data; // { data: [], meta: { total, ... } }
        },
    });

    const columns = [
        {
            title: 'Code',
            dataIndex: 'employeeCode',
            key: 'employeeCode',
            className: 'font-mono text-slate-600',
        },
        {
            title: 'Name',
            key: 'name',
            className: 'font-medium',
            render: (_: any, record: any) => `${record.firstName} ${record.lastName}`,
        },
        {
            title: 'Department',
            key: 'department',
            render: (_: any, record: any) => record.department?.name || '-',
        },
        {
            title: 'Designation',
            key: 'designation',
            render: (_: any, record: any) => record.designation?.name || '-',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'ACTIVE' ? 'success' : 'warning'} className="border-none px-2 py-0.5 rounded-full">
                    {status?.replace('_', ' ') || 'UNKNOWN'}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any) => (
                <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/employees/${record.id}`)}
                    className="text-slate-500 hover:text-slate-900"
                >
                    View
                </Button>
            ),
        },
    ];

    const handleTableChange = (pagination: any) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div>
                    <Title level={3} className="!mb-1">Employees directory</Title>
                </div>
                {(user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN') && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/employees/new')}
                    >
                        Add Employee
                    </Button>
                )}
            </div>

            <Card bordered={false} className="shadow-sm">
                <div className="mb-4 flex gap-4 md:w-1/2">
                    <Input
                        placeholder="Search by Name or Code"
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={e => {
                            setSearchText(e.target.value);
                            setCurrentPage(1); // Reset page on search
                        }}
                        className="bg-white border-slate-200 text-slate-900"
                    />
                    <Select
                        value={statusFilter}
                        onChange={val => {
                            setStatusFilter(val);
                            setCurrentPage(1);
                        }}
                        className="w-32 bg-white"
                    >
                        <Option value="All">All Status</Option>
                        <Option value="ACTIVE">Active</Option>
                        <Option value="ON_LEAVE">On Leave</Option>
                        <Option value="TERMINATED">Terminated</Option>
                    </Select>
                </div>
                <Table
                    columns={columns}
                    dataSource={employeesData?.data || []}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: employeesData?.meta?.total || 0,
                        showSizeChanger: true
                    }}
                    onChange={handleTableChange}
                    className="custom-table"
                />
            </Card>
        </div>
    );
}
