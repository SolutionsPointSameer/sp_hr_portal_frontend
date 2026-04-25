import { Typography, Card, Calendar, Badge, Spin, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const { Title, Text } = Typography;

// Status badge type mapping
const statusBadge: Record<string, 'success' | 'warning' | 'error' | 'processing'> = {
    APPROVED: 'success',
    PENDING: 'warning',
    REJECTED: 'error',
};

export default function LeaveCalendar() {
    const user = useAuthStore(state => state.user);
    const isAdmin = user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';
    const [viewMode, setViewMode] = useState<'mine' | 'team'>('mine');

    // Fetch my leaves
    const { data: myLeaves = [], isLoading: isLoadingMine } = useQuery({
        queryKey: ['leave', 'mine'],
        queryFn: async () => {
            const res = await apiClient.get('/leave/mine');
            return res.data || [];
        },
    });

    // Fetch all team leaves (only for managers/admins)
    const { data: teamLeaves = [], isLoading: isLoadingTeam } = useQuery({
        queryKey: ['leave', 'all'],
        queryFn: async () => {
            const res = await apiClient.get('/leave/all');
            return res.data?.data || res.data || [];
        },
        enabled: isAdmin,
    });

    const holidaysQuery = useQuery({
        queryKey: ['holidays', dayjs().year()],
        queryFn: async () => {
            const res = await apiClient.get('/holidays', { params: { year: dayjs().year() } });
            return res.data;
        }
    });

    const activeLeaves = viewMode === 'mine' ? myLeaves : teamLeaves;
    const isLoading = viewMode === 'mine' ? isLoadingMine : isLoadingTeam;

    // Build a map of date → leave items for efficient lookup
    const leaveDateMap: Record<string, { label: string; status: string }[]> = {};

    (activeLeaves as any[]).forEach((leave: any) => {
        if (!leave.fromDate || !leave.toDate) return;
        const from = dayjs(leave.fromDate);
        const to = dayjs(leave.toDate);
        let curr = from;

        const name = leave.employee
            ? `${leave.employee.firstName} ${leave.employee.lastName}`
            : 'Me';
        const leaveTypeName = leave.leaveType?.name || 'Leave';
        const label = `${name} (${leaveTypeName})`;

        while (curr.isBefore(to) || curr.isSame(to, 'day')) {
            const key = curr.format('YYYY-MM-DD');
            if (!leaveDateMap[key]) leaveDateMap[key] = [];
            leaveDateMap[key].push({ label, status: leave.status });
            curr = curr.add(1, 'day');
        }
    });

    const dateCellRender = (value: Dayjs) => {
        const key = value.format('YYYY-MM-DD');
        const items = leaveDateMap[key] || [];
        const isHoliday = holidaysQuery.data?.find((h: any) => dayjs(h.date).format('YYYY-MM-DD') === key);
        return (
            <ul className="m-0 p-0 list-none">
                {items.map((item, i) => (
                    <li key={i} className="text-xs truncate text-left mb-1">
                        <Badge
                            status={statusBadge[item.status] || 'default'}
                            text={<span className="text-slate-600">{item.label}</span>}
                        />
                    </li>
                ))}
                {isHoliday && (
                    <li className="text-xs truncate text-left mb-1">
                        <Badge
                            color="purple"
                            text={<span className="text-purple-600 font-medium">{isHoliday.name}</span>}
                        />
                    </li>
                )}
            </ul>
        );
    };

    const cellRender = (current: Dayjs, info: { type: string; originNode: ReactNode }) => {
        if (info.type === 'date') return dateCellRender(current);
        return info.originNode;
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div>
                    <Title level={3} className="!mb-1">Leave Calendar</Title>
                    <Text className="text-slate-500">View approved and pending leaves.</Text>
                </div>
                {isAdmin && (
                    <Select
                        value={viewMode}
                        onChange={setViewMode}
                        className="w-40"
                        options={[
                            { label: 'My Leaves', value: 'mine' },
                            { label: 'Team Leaves', value: 'team' },
                        ]}
                    />
                )}
            </div>

            <Card bordered={false} className="shadow-sm attendance-calendar overflow-x-auto min-w-[600px]">
                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <Spin size="large" />
                    </div>
                ) : (
                    <Calendar cellRender={cellRender} className="bg-transparent" />
                )}
            </Card>

            {/* Legend */}
            <div className="flex gap-4 text-sm text-slate-500">
                <span><Badge status="success" /> Approved</span>
                <span><Badge status="warning" /> Pending</span>
                <span><Badge status="error" /> Rejected</span>
            </div>
        </div>
    );
}
