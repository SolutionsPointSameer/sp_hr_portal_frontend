import { useMemo, useState } from 'react';
import {
    Button,
    Card,
    DatePicker,
    Form,
    Input,
    Modal,
    Popconfirm,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    message
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { apiClient } from '../../api/client';

const { Title, Text } = Typography;

interface HolidayRecord {
    id: string;
    name: string;
    date: string;
    type: string;
}

interface HolidayFormValues {
    name: string;
    date: dayjs.Dayjs;
    type: string;
}

const HOLIDAY_TYPES = [
    { label: 'Public Holiday', value: 'public' },
    { label: 'Company Holiday', value: 'company' },
    { label: 'Restricted Holiday', value: 'restricted' }
];

export default function ManageHolidayCalendar() {
    const [selectedYear, setSelectedYear] = useState(dayjs().year());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<HolidayRecord | null>(null);
    const [form] = Form.useForm<HolidayFormValues>();
    const queryClient = useQueryClient();

    const holidaysQuery = useQuery({
        queryKey: ['holidays', selectedYear],
        queryFn: async () => {
            const response = await apiClient.get('/holidays', {
                params: { year: selectedYear }
            });
            return response.data as HolidayRecord[];
        }
    });

    const createHolidayMutation = useMutation({
        mutationFn: async (values: HolidayFormValues) => {
            const payload = {
                name: values.name.trim(),
                date: values.date.format('YYYY-MM-DD'),
                type: values.type
            };
            const response = await apiClient.post('/holidays', payload);
            return response.data;
        },
        onSuccess: () => {
            message.success('Holiday created successfully');
            closeModal();
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || error.response?.data?.error || 'Failed to create holiday');
        }
    });

    const updateHolidayMutation = useMutation({
        mutationFn: async (values: HolidayFormValues) => {
            if (!editingHoliday) {
                throw new Error('Missing holiday to update');
            }

            const payload = {
                name: values.name.trim(),
                date: values.date.format('YYYY-MM-DD'),
                type: values.type
            };
            const response = await apiClient.patch(`/holidays/${editingHoliday.id}`, payload);
            return response.data;
        },
        onSuccess: () => {
            message.success('Holiday updated successfully');
            closeModal();
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || error.response?.data?.error || 'Failed to update holiday');
        }
    });

    const deleteHolidayMutation = useMutation({
        mutationFn: async (holidayId: string) => {
            await apiClient.delete(`/holidays/${holidayId}`);
        },
        onSuccess: () => {
            message.success('Holiday deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || error.response?.data?.error || 'Failed to delete holiday');
        }
    });

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingHoliday(null);
        form.resetFields();
    };

    const openCreateModal = () => {
        setEditingHoliday(null);
        form.resetFields();
        form.setFieldsValue({
            type: 'public',
            date: dayjs()
        });
        setIsModalOpen(true);
    };

    const openEditModal = (record: HolidayRecord) => {
        setEditingHoliday(record);
        form.setFieldsValue({
            name: record.name,
            date: dayjs(record.date),
            type: record.type
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();
        if (editingHoliday) {
            updateHolidayMutation.mutate(values);
            return;
        }
        createHolidayMutation.mutate(values);
    };

    const holidayCounts = useMemo(() => {
        const holidays = holidaysQuery.data ?? [];
        return holidays.reduce(
            (acc, holiday) => {
                acc.total += 1;
                if (holiday.type === 'public') acc.public += 1;
                if (holiday.type === 'company') acc.company += 1;
                if (holiday.type === 'restricted') acc.restricted += 1;
                return acc;
            },
            { total: 0, public: 0, company: 0, restricted: 0 }
        );
    }, [holidaysQuery.data]);

    const columns = [
        {
            title: 'Holiday Name',
            dataIndex: 'name',
            key: 'name',
            className: 'font-medium'
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (value: string) => dayjs(value).format('DD MMM YYYY')
        },
        {
            title: 'Day',
            dataIndex: 'date',
            key: 'day',
            render: (value: string) => dayjs(value).format('dddd')
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (value: string) => {
                const colorMap: Record<string, string> = {
                    public: 'red',
                    company: 'blue',
                    restricted: 'gold'
                };
                return <Tag color={colorMap[value] || 'default'}>{value.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 180,
            render: (_: unknown, record: HolidayRecord) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete holiday?"
                        description="This will remove the holiday from the calendar."
                        okText="Delete"
                        okButtonProps={{ danger: true, loading: deleteHolidayMutation.isPending }}
                        onConfirm={() => deleteHolidayMutation.mutate(record.id)}
                    >
                        <Button danger size="small" icon={<DeleteOutlined />}>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div className="p-4 sm:p-8 space-y-8 animate-fade-in max-w-[1400px] mx-auto">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <Title level={2} className="!mb-1 page-heading" style={{ color: '#26428b' }}>
                        Manage Holiday Calendar
                    </Title>
                    <Text className="text-slate-500">
                        Maintain the official holiday list used across the organization.
                    </Text>
                </div>
                <Space wrap>
                    <DatePicker
                        picker="year"
                        allowClear={false}
                        value={dayjs(`${selectedYear}-01-01`)}
                        onChange={(value) => setSelectedYear(value?.year() || dayjs().year())}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} className="bg-[#e00c05] hover:bg-[#c00a04]">
                        Add Holiday
                    </Button>
                </Space>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card bordered={false} className="shadow-sm">
                    <Text className="text-slate-500 text-xs uppercase tracking-wide">Year</Text>
                    <Title level={3} className="!mb-0 !mt-2">{selectedYear}</Title>
                </Card>
                <Card bordered={false} className="shadow-sm">
                    <Text className="text-slate-500 text-xs uppercase tracking-wide">Total Holidays</Text>
                    <Title level={3} className="!mb-0 !mt-2">{holidayCounts.total}</Title>
                </Card>
                <Card bordered={false} className="shadow-sm">
                    <Text className="text-slate-500 text-xs uppercase tracking-wide">Public Holidays</Text>
                    <Title level={3} className="!mb-0 !mt-2">{holidayCounts.public}</Title>
                </Card>
                <Card bordered={false} className="shadow-sm">
                    <Text className="text-slate-500 text-xs uppercase tracking-wide">Company Holidays</Text>
                    <Title level={3} className="!mb-0 !mt-2">{holidayCounts.company}</Title>
                </Card>
            </div>

            <Card bordered={false} className="shadow-xl border-slate-100 rounded-2xl">
                <Table
                    columns={columns}
                    dataSource={holidaysQuery.data || []}
                    rowKey="id"
                    loading={holidaysQuery.isLoading}
                    pagination={{ pageSize: 10, size: 'small' }}
                    className="custom-table"
                    locale={{ emptyText: `No holidays configured for ${selectedYear}.` }}
                />
            </Card>

            <Modal
                title={editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
                open={isModalOpen}
                onOk={handleSubmit}
                onCancel={closeModal}
                okText={editingHoliday ? 'Save Changes' : 'Create Holiday'}
                confirmLoading={createHolidayMutation.isPending || updateHolidayMutation.isPending}
            >
                <Form form={form} layout="vertical" size="large" className="mt-4">
                    <Form.Item
                        name="name"
                        label="Holiday Name"
                        rules={[{ required: true, message: 'Please enter holiday name' }]}
                    >
                        <Input placeholder="e.g. Independence Day" />
                    </Form.Item>
                    <Form.Item
                        name="date"
                        label="Holiday Date"
                        rules={[{ required: true, message: 'Please select holiday date' }]}
                    >
                        <DatePicker className="w-full" />
                    </Form.Item>
                    <Form.Item
                        name="type"
                        label="Holiday Type"
                        rules={[{ required: true, message: 'Please select holiday type' }]}
                    >
                        <Select options={HOLIDAY_TYPES} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
