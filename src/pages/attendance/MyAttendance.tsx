import { Typography, Card, Button, Table, Calendar, Tag, Row, Col, message } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, InfoCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// Helper: get current geolocation as a Promise — throws if denied
function getGeolocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser.'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => reject(new Error('Location access is required to check in/out. Please enable location permissions and try again.')),
            { timeout: 8000 }
        );
    });
}

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

    const holidaysQuery = useQuery({
        queryKey: ['holidays', dayjs().year()],
        queryFn: async () => {
            const res = await apiClient.get('/holidays', { params: { year: dayjs().year() } });
            return res.data;
        }
    });

    // Check In Mutation — sends lat/lng if available
    const checkInMutation = useMutation({
        mutationFn: async () => {
            const coords = await getGeolocation();
            const res = await apiClient.post('/attendance/check-in', coords);
            return res.data;
        },
        onSuccess: () => {
            message.success('Checked in successfully');
            queryClient.invalidateQueries({ queryKey: ['attendance', 'mine'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || error.message || 'Check-in failed');
        }
    });

    // Check Out Mutation — sends lat/lng if available
    const checkOutMutation = useMutation({
        mutationFn: async () => {
            const coords = await getGeolocation();
            const res = await apiClient.post('/attendance/check-out', coords);
            return res.data;
        },
        onSuccess: () => {
            message.success('Checked out successfully');
            queryClient.invalidateQueries({ queryKey: ['attendance', 'mine'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || error.message || 'Check-out failed');
        }
    });

    // Determine today's status
    const today = dayjs().format('YYYY-MM-DD');
    const todayRecord = attendanceData?.find((record: any) => dayjs(record.date).format('YYYY-MM-DD') === today);

    const checkedIn = !!todayRecord?.checkIn;
    const checkedOut = !!todayRecord?.checkOut;
    const checkInTime = todayRecord?.checkIn ? dayjs(todayRecord.checkIn).format('hh:mm A') : null;
    const checkOutTime = todayRecord?.checkOut ? dayjs(todayRecord.checkOut).format('hh:mm A') : null;

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (text: string) => dayjs(text).format('DD MMM YYYY')
        },
        {
            title: 'Check In',
            key: 'checkIn',
            render: (_: any, record: any) => (
                <div>
                    <div className="font-mono text-slate-700">
                        {record.checkIn ? dayjs(record.checkIn).format('hh:mm A') : '-'}
                    </div>
                    {record.checkInAddress && (
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <EnvironmentOutlined />
                            <span className="truncate max-w-[180px]">{record.checkInAddress}</span>
                        </div>
                    )}
                </div>
            )
        },
        {
            title: 'Check Out',
            key: 'checkOut',
            render: (_: any, record: any) => (
                <div>
                    <div className="font-mono text-slate-700">
                        {record.checkOut ? dayjs(record.checkOut).format('hh:mm A') : '-'}
                    </div>
                    {record.checkOutAddress && (
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <EnvironmentOutlined />
                            <span className="truncate max-w-[180px]">{record.checkOutAddress}</span>
                        </div>
                    )}
                </div>
            )
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

    const dateCellRender = (value: dayjs.Dayjs) => {
        const dateStr = value.format('YYYY-MM-DD');
        const record = attendanceData?.find((r: any) => dayjs(r.date).format('YYYY-MM-DD') === dateStr);
        
        // Find holiday
        const isHoliday = holidaysQuery.data?.find((h: any) => dayjs(h.date).format('YYYY-MM-DD') === dateStr);
        
        return (
            <div className="text-center text-xs mt-1">
                {record && (
                    <>
                        {record.status === 'present' && <div className="text-green-500 font-medium">Present</div>}
                        {record.status === 'absent' && <div className="text-red-500 font-medium">Absent</div>}
                        {record.status === 'on_leave' && <div className="text-blue-500 font-medium">Leave</div>}
                        {record.status === 'late' && <div className="text-amber-500 font-medium">Late</div>}
                    </>
                )}
                {!record && isHoliday && (
                    <div className="text-purple-500 font-medium">{isHoliday.name}</div>
                )}
            </div>
        );
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
                                    onClick={() => checkInMutation.mutate()}
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
                                    onClick={() => checkOutMutation.mutate()}
                                    disabled={!checkedIn || checkedOut}
                                    loading={checkOutMutation.isPending}
                                >
                                    Check Out
                                </Button>
                            </div>

                            {/* Check-in status & location */}
                            {checkedIn && (
                                <div className="flex flex-col items-center gap-2 w-full">
                                    <Text type="success" className="flex items-center gap-2 text-sm">
                                        <InfoCircleOutlined />
                                        {checkedOut
                                            ? `In ${checkInTime}  ·  Out ${checkOutTime}`
                                            : `Checked in at ${checkInTime}`
                                        }
                                    </Text>

                                    {todayRecord?.checkInAddress && (
                                        <div className="w-full bg-slate-50 rounded-lg px-3 py-2 text-left">
                                            <div className="text-xs font-medium text-slate-400 mb-0.5">Check-In Location</div>
                                            <div className="flex items-start gap-1.5 text-xs text-slate-600">
                                                <EnvironmentOutlined className="text-green-500 mt-0.5 flex-shrink-0" />
                                                <span>{todayRecord.checkInAddress}</span>
                                            </div>
                                        </div>
                                    )}

                                    {todayRecord?.checkOutAddress && (
                                        <div className="w-full bg-slate-50 rounded-lg px-3 py-2 text-left">
                                            <div className="text-xs font-medium text-slate-400 mb-0.5">Check-Out Location</div>
                                            <div className="flex items-start gap-1.5 text-xs text-slate-600">
                                                <EnvironmentOutlined className="text-red-400 mt-0.5 flex-shrink-0" />
                                                <span>{todayRecord.checkOutAddress}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
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
