import { Typography, Card, Button, Table, Calendar, Tag, Row, Col, message } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function MyAttendance() {
    const queryClient = useQueryClient();

    // Fetch My Attendance
    const { data: attendanceData, isLoading } = useQuery({
        queryKey: ['attendance', 'mine'],
        queryFn: async () => {
            const res = await apiClient.get('/attendance/mine');
            return res.data;
        }
    });

    // Check In Mutation
    const checkInMutation = useMutation({
        mutationFn: async () => {
            const res = await apiClient.post('/attendance/check-in');
            return res.data;
        },
        onSuccess: () => {
            message.success('Checked in successfully');
            queryClient.invalidateQueries({ queryKey: ['attendance', 'mine'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Check-in failed');
        }
    });

    // Check Out Mutation
    const checkOutMutation = useMutation({
        mutationFn: async () => {
            const res = await apiClient.post('/attendance/check-out');
            return res.data;
        },
        onSuccess: () => {
            message.success('Checked out successfully');
            queryClient.invalidateQueries({ queryKey: ['attendance', 'mine'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Check-out failed');
        }
    });

    // Determine today's status
    const today = dayjs().format('YYYY-MM-DD');
    const todayRecord = attendanceData?.find((record: any) => dayjs(record.date).format('YYYY-MM-DD') === today);

    const checkedIn = !!todayRecord?.checkIn;
    const checkedOut = !!todayRecord?.checkOut;
    const checkInTime = todayRecord?.checkIn ? dayjs(todayRecord.checkIn).format('hh:mm A') : null;

    const handleCheckIn = () => {
        checkInMutation.mutate();
    };

    const handleCheckOut = () => {
        checkOutMutation.mutate();
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (text: string) => dayjs(text).format('YYYY-MM-DD')
        },
        {
            title: 'Check In',
            dataIndex: 'checkIn',
            key: 'checkIn',
            className: 'font-mono text-slate-600',
            render: (text: string) => text ? dayjs(text).format('hh:mm A') : '-'
        },
        {
            title: 'Check Out',
            dataIndex: 'checkOut',
            key: 'checkOut',
            className: 'font-mono text-slate-600',
            render: (text: string) => text ? dayjs(text).format('hh:mm A') : '-'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'default';
                if (status === 'present') color = 'success';
                if (status === 'absent') color = 'error';
                if (status === 'late') color = 'warning';
                if (status === 'on_leave') color = 'processing';
                return <Tag color={color} className="border-none uppercase">{status || 'UNKNOWN'}</Tag>;
            }
        }
    ];

    // Note: We might want a custom dateCellRender for Calendar later, but keeping it simple for now
    const dateCellRender = (value: dayjs.Dayjs) => {
        const dateStr = value.format('YYYY-MM-DD');
        const record = attendanceData?.find((r: any) => dayjs(r.date).format('YYYY-MM-DD') === dateStr);
        if (record) {
            return (
                <div className="text-center text-xs mt-1">
                    {record.status === 'present' && <div className="text-green-500 font-medium">Present</div>}
                    {record.status === 'absent' && <div className="text-red-500 font-medium">Absent</div>}
                    {record.status === 'on_leave' && <div className="text-blue-500 font-medium">Leave</div>}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div>
                    <Title level={3} className="!mb-1">My Attendance</Title>
                    <Text className="text-slate-500">Track your daily clock-ins and outs.</Text>
                </div>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                    <Card title="Today's Status" bordered={false} className="shadow-sm h-full">
                        <div className="flex flex-col items-center justify-center py-6 gap-6 text-center">
                            <div className="text-4xl font-light text-slate-900 tracking-widest font-mono">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="flex gap-4 w-full">
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<CheckCircleOutlined />}
                                    className={`flex-1 ${checkedIn ? 'bg-green-600 hover:bg-green-500' : 'bg-brand-red hover:bg-red-600'}`}
                                    onClick={handleCheckIn}
                                    disabled={checkedIn}
                                    loading={checkInMutation.isPending}
                                >
                                    {checkedIn ? 'Checked In' : 'Check In'}
                                </Button>
                                <Button
                                    type="default"
                                    size="large"
                                    icon={<ClockCircleOutlined />}
                                    className="flex-1 bg-slate-100 text-slate-900 border-slate-300 hover:text-brand-red hover:border-brand-red disabled:opacity-50"
                                    onClick={handleCheckOut}
                                    disabled={!checkedIn || checkedOut}
                                    loading={checkOutMutation.isPending}
                                >
                                    Check Out
                                </Button>
                            </div>
                            {checkedIn && !checkedOut && (
                                <Text type="success" className="flex items-center gap-2">
                                    <InfoCircleOutlined /> You are currently checked in since {checkInTime}
                                </Text>
                            )}
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={16}>
                    <Card title="Monthly Calendar" bordered={false} className="shadow-sm h-full attendance-calendar">
                        <Calendar
                            fullscreen={false}
                            className="bg-transparent"
                            cellRender={dateCellRender}
                        />
                    </Card>
                </Col>

                <Col span={24}>
                    <Card title="Recent History" bordered={false} className="shadow-sm">
                        <Table
                            columns={columns}
                            dataSource={attendanceData || []}
                            rowKey="id"
                            pagination={{ pageSize: 10 }}
                            loading={isLoading}
                            className="custom-table"
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
