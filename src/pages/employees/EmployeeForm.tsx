import { Form, Input, Button, Card, Typography, Select, DatePicker, Row, Col, message, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const employeeCategoryOptions = [
    { value: 'DIRECT', label: 'Direct Employee' },
    { value: 'DEPLOYED_MANPOWER', label: 'Payroll Employee Supplied to Client' },
];

export default function EmployeeForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);

    const canManageSalary = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

    // If id is 'new', we are creating. Otherwise editing.
    const isEditing = !!id && id !== 'new';

    // Watch department to filter designations
    const selectedDepartmentId = Form.useWatch('departmentId', form);
    const selectedEmployeeCategory = Form.useWatch('employeeCategory', form);

    // Fetch Departments
    const { data: departments, isLoading: isLoadingDepts } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const res = await apiClient.get('/departments');
            return res.data;
        }
    });

    // Fetch Locations
    const { data: locations, isLoading: isLoadingLocations } = useQuery({
        queryKey: ['locations'],
        queryFn: async () => {
            const res = await apiClient.get('/locations');
            return res.data;
        }
    });

    // Fetch Companies
    const { data: companies, isLoading: isLoadingCompanies } = useQuery({
        queryKey: ['companies'],
        queryFn: async () => {
            const res = await apiClient.get('/companies');
            return res.data;
        }
    });

    // Fetch Designations (Filtered by selected department if any)
    const { data: designations, isLoading: isLoadingDesigs } = useQuery({
        queryKey: ['designations', selectedDepartmentId],
        queryFn: async () => {
            const url = selectedDepartmentId
                ? `/designations?departmentId=${selectedDepartmentId}`
                : '/designations';
            const res = await apiClient.get(url);
            return res.data;
        }
    });

    // Fetch Managers (For now, just all active employees)
    const { data: managers, isLoading: isLoadingManagers } = useQuery({
        queryKey: ['employees', 'managers'],
        queryFn: async () => {
            const res = await apiClient.get('/employees?limit=100&status=ACTIVE');
            return res.data?.data || [];
        }
    });

    // Fetch Employee Data if Editing
    const { data: employeeData, isLoading: isLoadingEmployee } = useQuery({
        queryKey: ['employee', id],
        queryFn: async () => {
            const res = await apiClient.get(`/employees/${id}`);
            return res.data;
        },
        enabled: isEditing,
    });

    useEffect(() => {
        if (isEditing && employeeData) {
            form.setFieldsValue({
                ...employeeData,
                dateOfJoining: employeeData.dateOfJoining ? dayjs(employeeData.dateOfJoining) : null,
            });
        } else if (!isEditing) {
            form.setFieldsValue({
                employeeCategory: 'DIRECT',
                status: 'ACTIVE',
                employmentType: 'FULL_TIME'
            });
        }
    }, [employeeData, isEditing, form]);

    const mutation = useMutation({
        mutationFn: async (values: any) => {
            const payload = {
                ...values,
                companyId: values.employeeCategory === 'DIRECT' ? undefined : values.companyId,
                dateOfJoining: values.dateOfJoining ? values.dateOfJoining.format('YYYY-MM-DD') : undefined,
            };

            if (isEditing) {
                const res = await apiClient.patch(`/employees/${id}`, payload);
                return res.data;
            } else {
                const res = await apiClient.post('/employees', payload);
                return res.data;
            }
        },
        onSuccess: () => {
            message.success(isEditing ? 'Employee updated successfully' : 'Employee created successfully');
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            if (isEditing) queryClient.invalidateQueries({ queryKey: ['employee', id] });
            navigate('/employees');
        },
        onError: (error: any) => {
            console.error('Save error:', error);
            message.error(error.response?.data?.message || 'An error occurred while saving.');
        }
    });

    const onFinish = (values: any) => {
        mutation.mutate(values);
    };

    if (isEditing && isLoadingEmployee) {
        return <div className="flex justify-center p-12"><Spin size="large" /></div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/employees')}
                        className="text-slate-500 hover:text-slate-900"
                    />
                    <Title level={3} className="!mb-0">{isEditing ? 'Edit Employee' : 'Add New Employee'}</Title>
                </div>
            </div>

            <Card bordered={false} className="shadow-sm">
                <div className="mb-6">
                    <Text className="text-slate-500">Fill in the employee details below. All fields with * are required.</Text>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    {/* Personal Info */}
                    <Row gutter={24}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                                <Input placeholder="John" className="bg-white border-slate-200 text-slate-900" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                                <Input placeholder="Doe" className="bg-white border-slate-200 text-slate-900" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={24}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
                                <Input placeholder="john.doe@solutionspoint.net" className="bg-white border-slate-200 text-slate-900" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="phone" label="Phone Number">
                                <Input placeholder="+91 9876543210" className="bg-white border-slate-200 text-slate-900" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {!isEditing && (
                        <Row gutter={24}>
                            <Col xs={24} sm={12}>
                                <Form.Item name="password" label="Temporary Password" rules={[{ required: true, min: 6 }]}>
                                    <Input.Password placeholder="Min 6 characters" className="bg-white border-slate-200 text-slate-900" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} />
                        </Row>
                    )}
                    <Row gutter={24}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="employeeCategory" label="Employee Category" rules={[{ required: true }]}>
                                <Select placeholder="Select employee category" className="bg-white">
                                    {employeeCategoryOptions.map(option => (
                                        <Option key={option.value} value={option.value}>{option.label}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        {selectedEmployeeCategory === 'DIRECT' ? (
                            <Col xs={24} sm={12}>
                                <Form.Item label="Company">
                                    <Input value="SP Solutions Point" disabled className="bg-slate-50 border-slate-200 text-slate-500" />
                                </Form.Item>
                            </Col>
                        ) : (
                            <Col xs={24} sm={12}>
                                <Form.Item name="companyId" label="Client Company" rules={[{ required: true, message: 'Client company is required' }]}>
                                    <Select placeholder="Select client company" loading={isLoadingCompanies} className="bg-white">
                                        {companies?.map((c: any) => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                                    </Select>
                                </Form.Item>
                            </Col>
                        )}
                    </Row>

                    <Row gutter={24}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="locationId" label="Location" rules={[{ required: true }]}>
                                <Select placeholder="Select location" loading={isLoadingLocations} className="bg-white">
                                    {locations?.map((l: any) => <Option key={l.id} value={l.id}>{l.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                            <Col xs={24} sm={12}>
                                <div className="pt-8 text-sm text-slate-500">
                                    {selectedEmployeeCategory === 'DEPLOYED_MANPOWER'
                                        ? 'Select the client company where this payroll employee is deployed.'
                                        : 'Direct employees are automatically assigned to SP Solutions Point.'}
                                </div>
                            </Col>
                    </Row>

                    {/* Department, Designation, Manager */}
                    <Row gutter={24}>
                        <Col xs={24} sm={8}>
                            <Form.Item name="departmentId" label="Department" rules={[{ required: true }]}>
                                <Select
                                    placeholder="Select department"
                                    className="bg-white"
                                    loading={isLoadingDepts}
                                    onChange={() => form.setFieldValue('designationId', undefined)}
                                >
                                    {departments?.map((d: any) => (
                                        <Option key={d.id} value={d.id}>{d.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item name="designationId" label="Designation" rules={[{ required: true }]}>
                                <Select
                                    placeholder="Select designation"
                                    className="bg-white"
                                    loading={isLoadingDesigs}
                                    disabled={!selectedDepartmentId && !isEditing}
                                >
                                    {designations?.map((d: any) => (
                                        <Option key={d.id} value={d.id}>{d.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                name="managerId"
                                label="Reporting Manager"
                                rules={[{ required: true, message: 'Reporting manager is required' }]}
                            >
                                <Select
                                    placeholder="Select manager"
                                    className="bg-white"
                                    loading={isLoadingManagers}
                                    allowClear
                                >
                                    {managers?.map((m: any) => (
                                        m.id !== id && <Option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.employeeCode})</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Role, Type, Status, Joining Date */}
                    <Row gutter={24}>
                        <Col xs={24} sm={6}>
                            <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                                <Select className="bg-white">
                                    <Option value="EMPLOYEE">Employee</Option>
                                    <Option value="MANAGER">Manager</Option>
                                    <Option value="HR_ADMIN">HR Admin</Option>
                                    <Option value="SUPER_ADMIN">Super Admin</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={6}>
                            <Form.Item name="employmentType" label="Employment Type" rules={[{ required: true }]}>
                                <Select className="bg-white">
                                    <Option value="FULL_TIME">Full Time</Option>
                                    <Option value="CONTRACT">Contract</Option>
                                    <Option value="INTERN">Intern</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={6}>
                            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                                <Select className="bg-white">
                                    <Option value="ACTIVE">Active</Option>
                                    <Option value="ON_LEAVE">On Leave</Option>
                                    <Option value="TERMINATED">Terminated</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={6}>
                            <Form.Item name="dateOfJoining" label="Joining Date" rules={[{ required: true }]}>
                                <DatePicker className="w-full bg-white border-slate-200 text-slate-900" format="YYYY-MM-DD" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Salary - Admin only */}
                    {canManageSalary && (
                        <Row gutter={24}>
                            <Col xs={24} sm={12}>
                                <Form.Item name="ctc" label="CTC (Monthly)">
                                    <Input type="number" placeholder="e.g. 500000" className="bg-white border-slate-200 text-slate-900" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item name="inHandSalary" label="In-Hand Salary (Monthly)">
                                    <Input type="number" placeholder="e.g. 40000" className="bg-white border-slate-200 text-slate-900" />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}

                    <div className="flex justify-end gap-4 mt-6">
                        <Button onClick={() => navigate('/employees')} className="bg-slate-100 border-none text-slate-900 hover:bg-slate-200">
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            loading={mutation.isPending}
                        >
                            Save Employee
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
