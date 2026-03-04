import { Typography, Card, Calendar, Badge } from 'antd';
import type { Dayjs } from 'dayjs';
import type { ReactNode } from 'react';

const { Title, Text } = Typography;

export default function LeaveCalendar() {
    const getListData = (value: Dayjs) => {
        let listData;
        switch (value.date()) {
            case 8:
                listData = [
                    { type: 'warning', content: 'John Doe (Sick)' },
                    { type: 'success', content: 'Jane Smith (Annual)' },
                ];
                break;
            case 10:
                listData = [
                    { type: 'warning', content: 'Mike Jones (Sick)' },
                ];
                break;
            case 15:
                listData = [
                    { type: 'error', content: 'Company Holiday' },
                ];
                break;
            default:
        }
        return listData || [];
    };

    const dateCellRender = (value: Dayjs) => {
        const listData = getListData(value);
        return (
            <ul className="m-0 p-0 list-none">
                {listData.map((item) => (
                    <li key={item.content} className="text-xs truncate text-left mb-1">
                        <Badge status={item.type as any} text={<span className="text-slate-600">{item.content}</span>} />
                    </li>
                ))}
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
                    <Text className="text-slate-500">View team availability and company holidays.</Text>
                </div>
            </div>

            <Card bordered={false} className="shadow-sm attendance-calendar overflow-x-auto min-w-[600px]">
                <Calendar cellRender={cellRender} className="bg-transparent" />
            </Card>
        </div>
    );
}
