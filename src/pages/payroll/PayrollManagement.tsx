import { useMemo, useState } from 'react';
import {
    App,
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    InputNumber,
    Modal,
    Row,
    Select,
    Spin,
    Table,
    Tabs,
    Tag,
    Typography,
} from 'antd';
import { DollarOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { apiClient } from '../../api/client';

const { Title, Text } = Typography;
const { Search } = Input;

const MONTHS = [
    { label: 'January', value: 1 }, { label: 'February', value: 2 }, { label: 'March', value: 3 },
    { label: 'April', value: 4 }, { label: 'May', value: 5 }, { label: 'June', value: 6 },
    { label: 'July', value: 7 }, { label: 'August', value: 8 }, { label: 'September', value: 9 },
    { label: 'October', value: 10 }, { label: 'November', value: 11 }, { label: 'December', value: 12 },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => ({ label: String(currentYear - i), value: currentYear - i }));

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);

export default function PayrollManagement() {
    const queryClient = useQueryClient();
    const { message } = App.useApp();

    const [salaryModalOpen, setSalaryModalOpen] = useState(false);
    const [runModalOpen, setRunModalOpen] = useState(false);
    const [runDetailOpen, setRunDetailOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

    const [salaryForm] = Form.useForm();
    const [runForm] = Form.useForm();
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [employeePage, setEmployeePage] = useState(1);

    const { data: employeesData, isLoading: employeesLoading } = useQuery({
        queryKey: ['employees', 'payroll-management', employeeSearch, employeePage],
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(employeePage), limit: '20' });
            if (employeeSearch) params.set('search', employeeSearch);
            const res = await apiClient.get(`/employees?${params.toString()}`);
            return res.data;
        },
    });

    const { data: payrollRuns = [], isLoading: payrollRunsLoading } = useQuery({
        queryKey: ['payroll', 'runs'],
        queryFn: async () => {
            const res = await apiClient.get('/payroll/runs');
            return res.data;
        },
    });

    const { data: salaryStructures = [], isLoading: salaryStructuresLoading } = useQuery({
        queryKey: ['payroll', 'salary-structures', selectedEmployee?.id],
        queryFn: async () => {
            const res = await apiClient.get(`/payroll/salary-structures/${selectedEmployee.id}`);
            return res.data;
        },
        enabled: !!selectedEmployee?.id && salaryModalOpen,
    });

    const { data: selectedRun, isLoading: selectedRunLoading } = useQuery({
        queryKey: ['payroll', 'run', selectedRunId],
        queryFn: async () => {
            const res = await apiClient.get(`/payroll/runs/${selectedRunId}`);
            return res.data;
        },
        enabled: !!selectedRunId && runDetailOpen,
    });

    const salaryMutation = useMutation({
        mutationFn: async (values: any) => {
            if (!selectedEmployee?.id) throw new Error('No employee selected');

            const hasStructureValues = !!(values.effectiveDate || values.basic || values.hra || values.allowances || values.deductions);
            if (hasStructureValues && !values.effectiveDate) {
                throw new Error('Effective date is required when adding a salary structure');
            }

            await apiClient.patch(`/employees/${selectedEmployee.id}`, {
                ctc: values.ctc,
                inHandSalary: values.inHandSalary,
            });

            if (hasStructureValues) {
                await apiClient.post('/payroll/salary-structures', {
                    employeeId: selectedEmployee.id,
                    effectiveDate: values.effectiveDate.format('YYYY-MM-DD'),
                    basic: values.basic || 0,
                    hra: values.hra || 0,
                    allowances: values.allowances ? { Other: values.allowances } : {},
                    deductions: values.deductions ? { Other: values.deductions } : {},
                });
            }
        },
        onSuccess: async () => {
            message.success('Salary details updated');
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['employees'] }),
                queryClient.invalidateQueries({ queryKey: ['employees', 'payroll-management'] }),
                queryClient.invalidateQueries({ queryKey: ['reports', 'salary-metrics'] }),
                queryClient.invalidateQueries({ queryKey: ['payroll', 'salary-structures', selectedEmployee?.id] }),
            ]);
            setSalaryModalOpen(false);
            salaryForm.resetFields();
        },
        onError: (error: any) => {
            message.error(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update salary details');
        },
    });

    const createRunMutation = useMutation({
        mutationFn: async (values: any) => apiClient.post('/payroll/runs', values),
        onSuccess: async () => {
            message.success('Payroll run created');
            await queryClient.invalidateQueries({ queryKey: ['payroll', 'runs'] });
            setRunModalOpen(false);
            runForm.resetFields();
        },
        onError: (error: any) => {
            message.error(error.response?.data?.error || 'Failed to create payroll run');
        },
    });

    const finalizeRunMutation = useMutation({
        mutationFn: async (runId: string) => apiClient.patch(`/payroll/runs/${runId}/finalize`),
        onSuccess: async () => {
            message.success('Payroll run finalized');
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['payroll', 'runs'] }),
                queryClient.invalidateQueries({ queryKey: ['payroll', 'run', selectedRunId] }),
            ]);
        },
        onError: (error: any) => {
            message.error(error.response?.data?.error || 'Failed to finalize payroll run');
        },
    });

    const employees = employeesData?.data || [];

    const employeeColumns = [
        {
            title: 'Employee',
            key: 'employee',
            render: (_: any, record: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{record.firstName} {record.lastName}</span>
                    <span className="text-[11px] font-mono text-slate-400">{record.employeeCode}</span>
                </div>
            ),
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
            title: 'CTC',
            dataIndex: 'ctc',
            key: 'ctc',
            render: (value: number) => <span className="font-mono">{value ? formatCurrency(value) : '-'}</span>,
        },
        {
            title: 'In-Hand',
            dataIndex: 'inHandSalary',
            key: 'inHandSalary',
            render: (value: number) => <span className="font-mono text-green-700">{value ? formatCurrency(value) : '-'}</span>,
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: any) => (
                <Button
                    icon={<EditOutlined />}
                    onClick={() => {
                        setSelectedEmployee(record);
                        salaryForm.setFieldsValue({
                            ctc: record.ctc || undefined,
                            inHandSalary: record.inHandSalary || undefined,
                            basic: undefined,
                            hra: undefined,
                            allowances: undefined,
                            deductions: undefined,
                            effectiveDate: dayjs(),
                        });
                        setSalaryModalOpen(true);
                    }}
                >
                    Manage Salary
                </Button>
            ),
        },
    ];

    const runColumns = [
        {
            title: 'Period',
            key: 'period',
            render: (_: any, record: any) => <span className="font-semibold">{MONTHS.find(m => m.value === record.month)?.label} {record.year}</span>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => <Tag color={status === 'FINALIZED' ? 'success' : 'warning'}>{status}</Tag>,
        },
        {
            title: 'Employees',
            dataIndex: 'employeeCount',
            key: 'employeeCount',
        },
        {
            title: 'Net Pay',
            dataIndex: 'totalNetPay',
            key: 'totalNetPay',
            render: (value: number) => <span className="font-mono">{formatCurrency(value)}</span>,
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: any) => (
                <div className="flex gap-2">
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setSelectedRunId(record.id);
                            setRunDetailOpen(true);
                        }}
                    >
                        View
                    </Button>
                    {record.status === 'DRAFT' && (
                        <Button
                            danger
                            loading={finalizeRunMutation.isPending && selectedRunId === record.id}
                            onClick={() => {
                                setSelectedRunId(record.id);
                                finalizeRunMutation.mutate(record.id);
                            }}
                        >
                            Finalize
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    const runDetailColumns = [
        {
            title: 'Employee',
            key: 'employee',
            render: (_: any, record: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{record.employee?.firstName} {record.employee?.lastName}</span>
                    <span className="text-[11px] font-mono text-slate-400">{record.employee?.employeeCode || '-'}</span>
                </div>
            ),
        },
        {
            title: 'Department',
            key: 'department',
            render: (_: any, record: any) => record.employee?.department?.name || '-',
        },
        {
            title: 'Gross',
            dataIndex: 'gross',
            key: 'gross',
            render: (value: number) => formatCurrency(value),
        },
        {
            title: 'Deductions',
            dataIndex: 'deductions',
            key: 'deductions',
            render: (value: number) => <span className="text-red-600">{formatCurrency(value)}</span>,
        },
        {
            title: 'Net Pay',
            dataIndex: 'netPay',
            key: 'netPay',
            render: (value: number) => <span className="font-semibold text-green-700">{formatCurrency(value)}</span>,
        },
    ];

    const salarySummary = useMemo(() => {
        const withSalary = employees.filter((employee: any) => employee.ctc || employee.inHandSalary);
        const totalCtc = withSalary.reduce((sum: number, employee: any) => sum + Number(employee.ctc || 0), 0);
        const totalInHand = withSalary.reduce((sum: number, employee: any) => sum + Number(employee.inHandSalary || 0), 0);

        return {
            employeesWithSalary: withSalary.length,
            totalCtc,
            totalInHand,
        };
    }, [employees]);

    const payrollTab = (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 sm:flex-row flex-col">
                <div>
                    <Title level={4} className="!mb-1">Payroll Runs</Title>
                    <Text className="text-slate-500">Generate monthly payroll, review payouts, and finalize runs.</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setRunModalOpen(true)}>
                    Create Payroll Run
                </Button>
            </div>

            <Card bordered={false} className="shadow-sm">
                <Table
                    columns={runColumns}
                    dataSource={payrollRuns}
                    rowKey="id"
                    loading={payrollRunsLoading}
                    pagination={false}
                />
            </Card>
        </div>
    );

    const salariesTab = (
        <div className="flex flex-col gap-6">
            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card bordered={false} className="shadow-sm !rounded-2xl">
                        <Text className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">Employees with Salary Set</Text>
                        <div className="mt-3 text-3xl font-bold text-slate-900">{salarySummary.employeesWithSalary}</div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card bordered={false} className="shadow-sm !rounded-2xl">
                        <Text className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">Total CTC</Text>
                        <div className="mt-3 text-3xl font-bold text-slate-900">{formatCurrency(salarySummary.totalCtc)}</div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card bordered={false} className="shadow-sm !rounded-2xl">
                        <Text className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">Total In-Hand</Text>
                        <div className="mt-3 text-3xl font-bold text-emerald-700">{formatCurrency(salarySummary.totalInHand)}</div>
                    </Card>
                </Col>
            </Row>

            <Card bordered={false} className="shadow-sm">
                <div className="mb-5">
                    <Title level={4} className="!mb-1">Employee Salary Management</Title>
                    <Text className="text-slate-500">Maintain salary figures used in reporting and add salary structures used for payroll generation.</Text>
                    <div className="mt-3">
                        <Search
                            placeholder="Search employees by name, code, or email"
                            allowClear
                            onSearch={(val) => { setEmployeeSearch(val); setEmployeePage(1); }}
                            className="max-w-md"
                        />
                    </div>
                </div>
                <Table
                    columns={employeeColumns}
                    dataSource={employees}
                    rowKey="id"
                    loading={employeesLoading}
                    pagination={{
                        current: employeePage,
                        pageSize: 20,
                        total: employeesData?.total || 0,
                        onChange: (page) => setEmployeePage(page),
                        showSizeChanger: false,
                    }}
                />
            </Card>
        </div>
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 sm:flex-row flex-col">
                <div>
                    <Title level={3} className="!mb-1">Payroll Management</Title>
                    <Text className="text-slate-500">Manage employee salary data, salary structures, and monthly payroll runs.</Text>
                </div>
                <Tag color="blue" className="px-3 py-1 text-sm rounded-full border-none">
                    <DollarOutlined /> Payroll Control
                </Tag>
            </div>

            <Card bordered={false} className="shadow-sm">
                <Tabs
                    defaultActiveKey="salaries"
                    items={[
                        { key: 'salaries', label: 'Employee Salaries', children: salariesTab },
                        { key: 'runs', label: 'Payroll Runs', children: payrollTab },
                    ]}
                />
            </Card>

            <Modal
                title={selectedEmployee ? `Manage Salary: ${selectedEmployee.firstName} ${selectedEmployee.lastName}` : 'Manage Salary'}
                open={salaryModalOpen}
                onCancel={() => {
                    setSalaryModalOpen(false);
                    salaryForm.resetFields();
                }}
                onOk={() => salaryForm.submit()}
                confirmLoading={salaryMutation.isPending}
                width={860}
                okText="Save Salary"
            >
                <Form
                    form={salaryForm}
                    layout="vertical"
                    onFinish={(values) => salaryMutation.mutate(values)}
                    className="mt-4"
                >
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item name="ctc" label="CTC (Annual)">
                                <InputNumber className="w-full" min={0} precision={2} placeholder="Enter annual CTC" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="inHandSalary" label="In-Hand Salary (Monthly)">
                                <InputNumber className="w-full" min={0} precision={2} placeholder="Enter monthly in-hand salary" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className="mb-4 mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <Text className="font-semibold text-slate-700">Add Salary Structure For Payroll</Text>
                        <div className="text-sm text-slate-500">
                            Create a new salary structure when payroll components change. Leave these fields empty if you only need to update summary salary values.
                        </div>
                    </div>

                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item name="effectiveDate" label="Effective Date">
                                <DatePicker className="w-full" format="YYYY-MM-DD" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="basic" label="Basic">
                                <InputNumber className="w-full" min={0} precision={2} placeholder="Basic salary" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} md={8}>
                            <Form.Item name="hra" label="HRA">
                                <InputNumber className="w-full" min={0} precision={2} placeholder="HRA amount" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="allowances" label="Other Allowances">
                                <InputNumber className="w-full" min={0} precision={2} placeholder="Allowances total" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="deductions" label="Other Deductions">
                                <InputNumber className="w-full" min={0} precision={2} placeholder="Deductions total" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>

                <div className="mt-6">
                    <div className="mb-3">
                        <Text className="font-semibold text-slate-700">Existing Salary Structures</Text>
                    </div>
                    <Spin spinning={salaryStructuresLoading}>
                        <Table
                            rowKey="id"
                            size="small"
                            pagination={false}
                            dataSource={salaryStructures}
                            locale={{ emptyText: 'No salary structures recorded yet.' }}
                            columns={[
                                {
                                    title: 'Effective Date',
                                    dataIndex: 'effectiveDate',
                                    key: 'effectiveDate',
                                    render: (value: string) => dayjs(value).format('DD MMM YYYY'),
                                },
                                {
                                    title: 'Basic',
                                    dataIndex: 'basic',
                                    key: 'basic',
                                    render: (value: number) => formatCurrency(value),
                                },
                                {
                                    title: 'HRA',
                                    dataIndex: 'hra',
                                    key: 'hra',
                                    render: (value: number) => formatCurrency(value),
                                },
                                {
                                    title: 'Allowances',
                                    dataIndex: 'allowances',
                                    key: 'allowances',
                                    render: (value: Record<string, number>) => formatCurrency(Object.values(value || {}).reduce((sum, item) => sum + Number(item || 0), 0)),
                                },
                                {
                                    title: 'Deductions',
                                    dataIndex: 'deductions',
                                    key: 'deductions',
                                    render: (value: Record<string, number>) => formatCurrency(Object.values(value || {}).reduce((sum, item) => sum + Number(item || 0), 0)),
                                },
                            ]}
                        />
                    </Spin>
                </div>
            </Modal>

            <Modal
                title="Create Payroll Run"
                open={runModalOpen}
                onCancel={() => {
                    setRunModalOpen(false);
                    runForm.resetFields();
                }}
                onOk={() => runForm.submit()}
                confirmLoading={createRunMutation.isPending}
                okText="Generate Payroll"
            >
                <Form form={runForm} layout="vertical" onFinish={(values) => createRunMutation.mutate(values)} className="mt-4">
                    <Form.Item name="month" label="Month" rules={[{ required: true, message: 'Select month' }]}>
                        <Select options={MONTHS} placeholder="Select month" />
                    </Form.Item>
                    <Form.Item name="year" label="Year" rules={[{ required: true, message: 'Select year' }]}>
                        <Select options={YEARS} placeholder="Select year" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={selectedRun ? `${MONTHS.find(month => month.value === selectedRun.month)?.label} ${selectedRun.year} Payroll` : 'Payroll Run'}
                open={runDetailOpen}
                onCancel={() => setRunDetailOpen(false)}
                footer={null}
                width={980}
            >
                <Spin spinning={selectedRunLoading}>
                    {selectedRun ? (
                        <div className="flex flex-col gap-5">
                            <div className="flex items-center justify-between gap-4 sm:flex-row flex-col">
                                <div>
                                    <Text className="block text-slate-500">
                                        {selectedRun.payslips?.length || 0} payslips generated
                                    </Text>
                                    <Text className="block text-slate-500">
                                        Total net payout: {formatCurrency((selectedRun.payslips || []).reduce((sum: number, payslip: any) => sum + Number(payslip.netPay || 0), 0))}
                                    </Text>
                                </div>
                                {selectedRun.status === 'DRAFT' && (
                                    <Button
                                        type="primary"
                                        danger
                                        loading={finalizeRunMutation.isPending}
                                        onClick={() => finalizeRunMutation.mutate(selectedRun.id)}
                                    >
                                        Finalize Run
                                    </Button>
                                )}
                            </div>

                            <Table
                                columns={runDetailColumns}
                                dataSource={selectedRun.payslips || []}
                                rowKey="id"
                                pagination={{ pageSize: 10 }}
                            />
                        </div>
                    ) : (
                        <div className="py-12 text-center text-slate-500">Payroll run not found.</div>
                    )}
                </Spin>
            </Modal>
        </div>
    );
}
