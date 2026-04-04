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
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Fetch employees from API
    const { data: employeesData, isLoading } = useQuery({
        queryKey: ['employees', currentPage, pageSize, searchText, statusFilter, categoryFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: pageSize.toString(),
            });
            if (searchText) params.append('search', searchText);
            if (statusFilter !== 'All') params.append('status', statusFilter);
            if (categoryFilter !== 'All') params.append('employeeCategory', categoryFilter);

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
            title: 'Category',
            key: 'employeeCategory',
            render: (_: any, record: any) => (
                <Tag color={record.employeeCategory === 'DEPLOYED_MANPOWER' ? 'processing' : 'default'} className="border-none px-2 py-0.5 rounded-full">
                    {record.employeeCategory === 'DEPLOYED_MANPOWER' ? 'Deployed Manpower' : 'Direct'}
                </Tag>
            ),
        },
        {
            title: 'Company',
            key: 'company',
            render: (_: any, record: any) => record.company?.name || '-',
        },
        {
            title: 'Employment Type',
            key: 'employmentType',
            render: (_: any, record: any) => record.employmentType?.replaceAll('_', ' ') || '-',
        },
        {
            title: 'Location',
            key: 'location',
            render: (_: any, record: any) => record.location?.name || '-',
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
                    <Title level={3} className="!mb-1">Employee Directory</Title>
                    <span className="text-slate-500 text-sm">Manage and view all employees in your organisation.</span>
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
                <div className="mb-4 flex gap-4 flex-wrap md:w-4/5">
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
                    <Select
                        value={categoryFilter}
                        onChange={val => {
                            setCategoryFilter(val);
                            setCurrentPage(1);
                        }}
                        className="w-52 bg-white"
                    >
                        <Option value="All">All Categories</Option>
                        <Option value="DIRECT">Direct</Option>
                        <Option value="DEPLOYED_MANPOWER">Deployed Manpower</Option>
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
