import { Typography, Card, Table, Avatar, Row, Col, Statistic, DatePicker } from 'antd';
import { UserOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import dayjs from 'dayjs';
import { useState, useMemo } from 'react';

const { Title, Text } = Typography;

export default function TeamAttendance() {
    const [selectedMonth, setSelectedMonth] = useState(dayjs());

    const month = selectedMonth.month() + 1;
    const year = selectedMonth.year();

    // GET /attendance/all — flat array with nested employee
    const { data: records = [], isLoading } = useQuery({
        queryKey: ['attendance', 'all', month, year],
        queryFn: async () => {
            const res = await apiClient.get(`/attendance/all?month=${month}&year=${year}`);
            return res.data || [];
        }
    });

    // Group records by employee ID
    const teamData = useMemo(() => {
        const empMap: Record<string, any> = {};
        const todayStr = dayjs().format('YYYY-MM-DD');

        (records as any[]).forEach((record: any) => {
            const emp = record.employee;
            if (!emp) return;

            if (!empMap[emp.id]) {
                empMap[emp.id] = {
                    id: emp.id,
                    name: `${emp.firstName} ${emp.lastName}`,
                    initials: `${emp.firstName?.charAt(0) ?? ''}${emp.lastName?.charAt(0) ?? ''}`,
                    employeeCode: emp.employeeCode,
                    department: emp.department?.name || '-',
                    designation: emp.designation?.name || '-',
                    present: 0,
                    absent: 0,
                    onLeave: 0,
                    todayStatus: null,
                    checkInTime: null,
                    checkOutTime: null,
                    checkInAddress: null,
                    checkOutAddress: null,
                };
            }

            const entry = empMap[emp.id];

            // Tally monthly stats
            if (record.status === 'present' || record.checkIn) entry.present++;
            else if (record.status === 'absent') entry.absent++;
            else if (record.status === 'on_leave') entry.onLeave++;

            // Today's check-in/out details
            if (dayjs(record.date).format('YYYY-MM-DD') === todayStr) {
                entry.todayStatus = record.status || (record.checkIn ? 'present' : null);
                entry.checkInTime = record.checkIn ? dayjs(record.checkIn).format('hh:mm A') : null;
                entry.checkOutTime = record.checkOut ? dayjs(record.checkOut).format('hh:mm A') : null;
                entry.checkInAddress = record.checkInAddress ?? null;
                entry.checkOutAddress = record.checkOutAddress ?? null;
            }
        });

        return Object.values(empMap);
    }, [records]);

    const totalTeamSize = teamData.length;
    const presentToday = teamData.filter((d: any) => d.todayStatus === 'present').length;
    const onLeaveToday = teamData.filter((d: any) => d.todayStatus === 'on_leave').length;
    const notCheckedIn = teamData.filter((d: any) => !d.todayStatus).length;

    const columns = [
        {
            title: 'Employee',
            key: 'employee',
            render: (_: any, record: any) => (
                <div className="flex items-center gap-3">
                    <Avatar className="bg-red-100 text-red-600 font-semibold flex-shrink-0">
                        {record.initials || <UserOutlined />}
                    </Avatar>
                    <div>
                        <div className="font-medium text-slate-800">{record.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{record.employeeCode}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
            render: (text: string) => <span className="text-slate-600 text-sm">{text}</span>,
        },
        {
            title: 'Check In',
            key: 'checkIn',
            render: (_: any, record: any) => record.checkInTime ? (
                <div>
                    <div className="font-mono text-slate-700 text-sm">{record.checkInTime}</div>
                    {record.checkInAddress && (
                        <div className="flex items-start gap-1 text-xs text-slate-400 mt-0.5">
                            <EnvironmentOutlined className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{record.checkInAddress}</span>
                        </div>
                    )}
                </div>
            ) : <span className="text-slate-300 text-sm">—</span>,
        },
        {
            title: 'Check Out',
            key: 'checkOut',
            render: (_: any, record: any) => record.checkOutTime ? (
                <div>
                    <div className="font-mono text-slate-700 text-sm">{record.checkOutTime}</div>
                    {record.checkOutAddress && (
                        <div className="flex items-start gap-1 text-xs text-slate-400 mt-0.5">
                            <EnvironmentOutlined className="text-red-400 mt-0.5 flex-shrink-0" />
                            <span>{record.checkOutAddress}</span>
                        </div>
                    )}
                </div>
            ) : <span className="text-slate-300 text-sm">—</span>,
        },
        {
            title: 'Present',
            dataIndex: 'present',
            key: 'present',
            render: (v: number) => <span className="text-green-700 font-medium">{v}</span>,
        },
        {
            title: 'Absent',
            dataIndex: 'absent',
            key: 'absent',
            render: (v: number) => <span className="text-red-500 font-medium">{v}</span>,
        },
        {
            title: 'Leave',
            dataIndex: 'onLeave',
            key: 'onLeave',
            render: (v: number) => <span className="text-blue-500 font-medium">{v}</span>,
        },
        {
            title: "Today's Status",
            dataIndex: 'todayStatus',
            key: 'todayStatus',
            render: (text: string) => {
                let dotClass = 'bg-slate-300';
                let statusText = 'Not Checked In';
                if (text === 'present') { dotClass = 'bg-green-500'; statusText = 'Present'; }
                if (text === 'on_leave') { dotClass = 'bg-blue-500'; statusText = 'On Leave'; }
                if (text === 'absent') { dotClass = 'bg-red-500'; statusText = 'Absent'; }
                if (text === 'late') { dotClass = 'bg-amber-400'; statusText = 'Late'; }

                return (
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
                        <span className="text-sm">{statusText}</span>
                    </div>
                );
            }
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div>
                    <Title level={3} className="!mb-1">Team Attendance</Title>
                    <Text className="text-slate-500">Overview of your team's attendance records.</Text>
                </div>
                <DatePicker
                    picker="month"
                    value={selectedMonth}
                    onChange={(val) => val && setSelectedMonth(val)}
                    allowClear={false}
                    className="bg-white border-slate-200"
                />
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={12} md={6}>
                    <Card bordered={false} className="shadow-sm border-t-2 border-t-brand-red bg-slate-50">
                        <Statistic title={<span className="text-slate-500">Team Size</span>} value={totalTeamSize} valueStyle={{ color: '#0f172a' }} loading={isLoading} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card bordered={false} className="shadow-sm border-t-2 border-t-green-500 bg-slate-50">
                        <Statistic title={<span className="text-slate-500">Present Today</span>} value={presentToday} valueStyle={{ color: '#0f172a' }} loading={isLoading} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card bordered={false} className="shadow-sm border-t-2 border-t-blue-500 bg-slate-50">
                        <Statistic title={<span className="text-slate-500">On Leave Today</span>} value={onLeaveToday} valueStyle={{ color: '#0f172a' }} loading={isLoading} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card bordered={false} className="shadow-sm border-t-2 border-t-orange-500 bg-slate-50">
                        <Statistic title={<span className="text-slate-500">Not Checked In</span>} value={notCheckedIn} valueStyle={{ color: '#0f172a' }} loading={isLoading} />
                    </Card>
                </Col>
            </Row>

            <Card bordered={false} className="shadow-sm">
                <Table
                    columns={columns}
                    dataSource={teamData}
                    rowKey="id"
                    pagination={{ pageSize: 15, showSizeChanger: true }}
                    loading={isLoading}
                    className="custom-table"
                    locale={{ emptyText: 'No attendance records found for this month.' }}
                />
            </Card>
        </div>
    );
}
