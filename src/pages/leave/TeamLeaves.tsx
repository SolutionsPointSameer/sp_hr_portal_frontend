import { Typography, Card, Table, Tag, Row, Col, Statistic, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function TeamLeaves() {
    const [searchText, setSearchText] = useState('');

    // Fetch All Team Leaves
    const { data: teamLeaves, isLoading } = useQuery({
        queryKey: ['leave', 'team'],
        queryFn: async () => {
            const res = await apiClient.get('/leave/team');
            return res.data;
        }
    });

    const filteredData = teamLeaves?.filter((item: any) =>
        `${item.employee?.firstName} ${item.employee?.lastName}`.toLowerCase().includes(searchText.toLowerCase()) ||
        item.employee?.employeeCode?.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: 'Employee',
            dataIndex: 'employee',
            key: 'employee',
            className: 'font-medium',
            render: (employee: any) => (
                <div>
                    <div>{employee?.firstName} {employee?.lastName}</div>
                    <Text type="secondary" className="text-xs">{employee?.employeeCode}</Text>
                </div>
            )
        },
        {
            title: 'Type',
            dataIndex: ['leaveType', 'name'],
            key: 'type',
        },
        {
            title: 'Duration',
            key: 'duration',
            render: (_: any, record: any) => (
                <div>
                    <div>{dayjs(record.fromDate).format('YYYY-MM-DD')} to {dayjs(record.toDate).format('YYYY-MM-DD')}</div>
                    <Text type="secondary" className="text-xs">{record.daysCount} days</Text>
                </div>
            )
        },
        {
            title: 'Reason',
            dataIndex: 'reason',
            key: 'reason',
            render: (text: string) => <Text className="text-slate-500">{text}</Text>
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
            title: 'Applied On',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text: string) => dayjs(text).format('YYYY-MM-DD')
        }
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div>
                    <Title level={3} className="!mb-1">Team Leaves</Title>
                    <Text className="text-slate-500">Track and manage leave history for your direct reports.</Text>
                </div>
                <Input
                    placeholder="Search employee by name or code"
                    prefix={<SearchOutlined className="text-slate-400" />}
                    className="max-w-md shadow-sm"
                    size="large"
                    onChange={e => setSearchText(e.target.value)}
                />
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card bordered={false} className="shadow-sm border-t-2 bg-slate-50 border-t-brand-red">
                        <Statistic
                            title={<span className="text-slate-500">Total Team Requests</span>}
                            value={teamLeaves?.length || 0}
                            valueStyle={{ color: '#0f172a' }}
                            loading={isLoading}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card bordered={false} className="shadow-sm border-t-2 bg-slate-50 border-t-orange-500">
                        <Statistic
                            title={<span className="text-slate-500">Pending Approvals</span>}
                            value={teamLeaves?.filter((l: any) => l.status === 'PENDING').length || 0}
                            valueStyle={{ color: '#0f172a' }}
                            loading={isLoading}
                        />
                    </Card>
                </Col>
            </Row>

            <Card bordered={false} className="shadow-sm">
                <Table
                    columns={columns}
                    dataSource={filteredData || []}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    loading={isLoading}
                    className="custom-table"
                    locale={{ emptyText: 'No team leave records found.' }}
                />
            </Card>
        </div>
    );
}
