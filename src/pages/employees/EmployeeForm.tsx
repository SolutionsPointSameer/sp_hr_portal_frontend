import { Form, Input, Button, Card, Typography, Select, DatePicker, Row, Col, message, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export default function EmployeeForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    // If id is 'new', we are creating. Otherwise editing.
    const isEditing = !!id && id !== 'new';

    // Watch department to filter designations
    const selectedDepartmentId = Form.useWatch('departmentId', form);

    // Fetch Departments
    const { data: departments, isLoading: isLoadingDepts } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const res = await apiClient.get('/departments');
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
                status: 'ACTIVE',
                employmentType: 'FULL_TIME'
            });
        }
    }, [employeeData, isEditing, form]);

    const mutation = useMutation({
        mutationFn: async (values: any) => {
            const payload = {
                ...values,
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

            <Card bordered={false} className="shadow-sm max-w-4xl">
                <div className="mb-6">
                    <Text className="text-slate-500">Fill in the employee details below. All fields with * are required.</Text>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
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

                    <Row gutter={24}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="employeeCode" label="Employee Code" rules={[{ required: true }]}>
                                <Input placeholder="EMP001" className="bg-white border-slate-200 text-slate-900" disabled={isEditing} />
                            </Form.Item>
                        </Col>
                        {!isEditing && (
                            <Col xs={24} sm={12}>
                                <Form.Item name="password" label="Temporary Password" rules={[{ required: true, min: 6 }]}>
                                    <Input.Password placeholder="Min 6 characters" className="bg-white border-slate-200 text-slate-900" />
                                </Form.Item>
                            </Col>
                        )}
                    </Row>

                    <Row gutter={24}>
                        <Col xs={24} sm={8}>
                            <Form.Item name="departmentId" label="Department" rules={[{ required: true }]}>
                                <Select
                                    placeholder="Select department"
                                    className="bg-white"
                                    loading={isLoadingDepts}
                                    onChange={() => form.setFieldValue('designationId', undefined)} // Reset designation when department changes
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
                            <Form.Item name="managerId" label="Reporting Manager">
                                <Select
                                    placeholder="Select manager"
                                    className="bg-white"
                                    loading={isLoadingManagers}
                                    allowClear
                                >
                                    {managers?.map((m: any) => (
                                        // Don't let an employee be their own manager
                                        m.id !== id && <Option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.employeeCode})</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

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
                                    <Option value="PART_TIME">Part Time</Option>
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
