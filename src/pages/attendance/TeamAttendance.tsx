import { Typography, Card, Table, Avatar, Row, Col, Statistic } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import dayjs from 'dayjs';
import { useState, useMemo } from 'react';

const { Title, Text } = Typography;

export default function TeamAttendance() {
    const [monthOffset] = useState(0); // 0 = current, -1 = previous, etc.

    // For simplicity, we just use the current month for team attendance
    // A robust system would send start/end dates or specific month/year
    const currentMonth = dayjs().add(monthOffset, 'month');
    const month = currentMonth.month() + 1;
    const year = currentMonth.year();

    const { data: teamResponse, isLoading } = useQuery({
        queryKey: ['attendance', 'team', month, year],
        queryFn: async () => {
            const res = await apiClient.get(`/attendance/team?month=${month}&year=${year}`);
            return res.data;
        }
    });

    const teamData = useMemo(() => {
        if (!teamResponse || !teamResponse.team) return [];
        return teamResponse.team.map((emp: any) => {
            const empRecords = teamResponse.records.filter((r: any) => r.employeeId === emp.id);
            const present = empRecords.filter((r: any) => r.status === 'present' || r.checkIn).length;
            const absent = empRecords.filter((r: any) => r.status === 'absent').length;
            const onLeave = empRecords.filter((r: any) => r.status === 'on_leave').length;

            // Check today's status
            const todayStr = dayjs().format('YYYY-MM-DD');
            const todayRecord = empRecords.find((r: any) => dayjs(r.date).format('YYYY-MM-DD') === todayStr);
            let todayStatus = null;
            if (todayRecord) {
                if (todayRecord.status) todayStatus = todayRecord.status;
                else if (todayRecord.checkIn) todayStatus = 'present';
            }

            return {
                id: emp.id,
                name: `${emp.firstName} ${emp.lastName}`,
                present,
                absent,
                onLeave,
                todayStatus
            };
        });
    }, [teamResponse]);

    const columns = [
        {
            title: 'Employee',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
                <div className="flex items-center gap-3">
                    <Avatar icon={<UserOutlined />} className="bg-slate-100 text-slate-500" />
                    <span className="font-medium">{text}</span>
                </div>
            ),
        },
        {
            title: 'Present Days',
            dataIndex: 'present',
            key: 'present',
        },
        {
            title: 'Absent Days',
            dataIndex: 'absent',
            key: 'absent',
        },
        {
            title: 'Leave Days',
            dataIndex: 'onLeave',
            key: 'onLeave',
        },
        {
            title: "Today's Status",
            dataIndex: 'todayStatus',
            key: 'todayStatus',
            render: (text: string) => {
                let dotClass = "bg-slate-300";
                let statusText = text || 'Unknown';
                if (text === 'present') { dotClass = "bg-green-500"; statusText = 'Present'; }
                if (text === 'on_leave') { dotClass = "bg-blue-500"; statusText = 'On Leave'; }
                if (text === 'absent') { dotClass = "bg-red-500"; statusText = 'Absent'; }
                if (!text) { dotClass = "bg-slate-400"; statusText = 'Not Checked In'; }

                return (
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${dotClass}`}></span>
                        {statusText}
                    </div>
                );
            }
        },
    ];

    // Calculate aggregations
    const totalTeamSize = teamData?.length || 0;
    const presentToday = teamData?.filter((d: any) => d.todayStatus === 'present').length || 0;
    const onLeaveToday = teamData?.filter((d: any) => d.todayStatus === 'on_leave').length || 0;
    const notCheckedIn = teamData?.filter((d: any) => !d.todayStatus).length || 0;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div>
                    <Title level={3} className="!mb-1">Team Attendance</Title>
                    <Text className="text-slate-500">Overview of your team's attendance records.</Text>
                </div>
                {/* 
                  Since /team API specifically expects month/year, 
                  we keep UI simple with a specific month selector or default to current.
                  Using RangePicker might be confusing if backend only handles 1 month
                */}
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
                    dataSource={teamData || []}
                    rowKey="id"
                    pagination={false}
                    loading={isLoading}
                    className="custom-table"
                />
            </Card>
        </div>
    );
}
