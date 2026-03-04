import { useState, useEffect } from 'react';
import {
    Typography, Card, Table, Button, Tabs, Modal, Form,
    Input, InputNumber, Select, message, Spin, Space, Popconfirm
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { apiClient } from '../../api/client';

const { Title, Text } = Typography;

interface Department {
    id: string;
    name: string;
}

interface Designation {
    id: string;
    name: string;
    level: number;
    departmentId: string;
    department?: Department;
}

export default function MasterDataManagement() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [loadingDeps, setLoadingDeps] = useState(false);
    const [loadingDesigs, setLoadingDesigs] = useState(false);

    // Modal states
    const [isDepModalOpen, setIsDepModalOpen] = useState(false);
    const [isDesigModalOpen, setIsDesigModalOpen] = useState(false);
    const [editingDep, setEditingDep] = useState<Department | null>(null);
    const [editingDesig, setEditingDesig] = useState<Designation | null>(null);

    const [depForm] = Form.useForm();
    const [desigForm] = Form.useForm();

    const fetchDepartments = async () => {
        setLoadingDeps(true);
        try {
            const res = await apiClient.get('/departments');
            setDepartments(res.data);
        } catch (error) {
            message.error('Failed to load departments');
        } finally {
            setLoadingDeps(false);
        }
    };

    const fetchDesignations = async () => {
        setLoadingDesigs(true);
        try {
            const res = await apiClient.get('/designations');
            setDesignations(res.data);
        } catch (error) {
            message.error('Failed to load designations');
        } finally {
            setLoadingDesigs(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
        fetchDesignations();
    }, []);

    // Department Handlers
    const handleDepSubmit = async (values: any) => {
        try {
            if (editingDep) {
                await apiClient.patch(`/departments/${editingDep.id}`, values);
                message.success('Department updated successfully');
            } else {
                await apiClient.post('/departments', values);
                message.success('Department added successfully');
            }
            setIsDepModalOpen(false);
            depForm.resetFields();
            setEditingDep(null);
            fetchDepartments();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to save department');
        }
    };

    const openEditDepModal = (record: Department) => {
        setEditingDep(record);
        depForm.setFieldsValue({ name: record.name });
        setIsDepModalOpen(true);
    };

    // Designation Handlers
    const handleDesigSubmit = async (values: any) => {
        try {
            if (editingDesig) {
                await apiClient.patch(`/designations/${editingDesig.id}`, values);
                message.success('Designation updated successfully');
            } else {
                await apiClient.post('/designations', values);
                message.success('Designation added successfully');
            }
            setIsDesigModalOpen(false);
            desigForm.resetFields();
            setEditingDesig(null);
            fetchDesignations();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to save designation');
        }
    };

    const openEditDesigModal = (record: Designation) => {
        setEditingDesig(record);
        desigForm.setFieldsValue({
            name: record.name,
            level: record.level,
            departmentId: record.departmentId
        });
        setIsDesigModalOpen(true);
    };

    const depColumns = [
        { title: 'Department Name', dataIndex: 'name', key: 'name', className: 'font-medium' },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_: any, record: Department) => (
                <Space>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openEditDepModal(record)}
                    >
                        Edit
                    </Button>
                </Space>
            )
        }
    ];

    const desigColumns = [
        { title: 'Designation Title', dataIndex: 'name', key: 'name', className: 'font-medium' },
        { title: 'Level', dataIndex: 'level', key: 'level' },
        {
            title: 'Department',
            key: 'department',
            render: (_: any, record: Designation) => record.department?.name || '-'
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_: any, record: Designation) => (
                <Space>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openEditDesigModal(record)}
                    >
                        Edit
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div>
                    <Title level={3} className="!mb-1">Master Data Management</Title>
                    <Text className="text-slate-500">Manage foundational entities like Departments and Designations.</Text>
                </div>
            </div>

            <Card bordered={false} className="shadow-sm p-0 overflow-hidden">
                <Tabs
                    defaultActiveKey="departments"
                    className="master-data-tabs px-6 py-2"
                >
                    <Tabs.TabPane tab="Departments" key="departments">
                        <div className="flex justify-end mb-4">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setEditingDep(null);
                                    depForm.resetFields();
                                    setIsDepModalOpen(true);
                                }}
                            >
                                Add Department
                            </Button>
                        </div>
                        <Table
                            columns={depColumns}
                            dataSource={departments}
                            rowKey="id"
                            loading={loadingDeps}
                            pagination={false}
                            className="custom-table border border-slate-200 rounded-lg"
                        />
                    </Tabs.TabPane>

                    <Tabs.TabPane tab="Designations" key="designations">
                        <div className="flex justify-end mb-4">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setEditingDesig(null);
                                    desigForm.resetFields();
                                    setIsDesigModalOpen(true);
                                }}
                            >
                                Add Designation
                            </Button>
                        </div>
                        <Table
                            columns={desigColumns}
                            dataSource={designations}
                            rowKey="id"
                            loading={loadingDesigs}
                            pagination={false}
                            className="custom-table border border-slate-200 rounded-lg"
                        />
                    </Tabs.TabPane>
                </Tabs>
            </Card>

            {/* Department Modal */}
            <Modal
                title={editingDep ? "Edit Department" : "Add New Department"}
                open={isDepModalOpen}
                onCancel={() => setIsDepModalOpen(false)}
                footer={null}
            >
                <Form
                    form={depForm}
                    layout="vertical"
                    onFinish={handleDepSubmit}
                    className="mt-4"
                >
                    <Form.Item
                        name="name"
                        label="Department Name"
                        rules={[{ required: true, message: 'Please enter department name' }]}
                    >
                        <Input placeholder="e.g. Engineering" />
                    </Form.Item>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button onClick={() => setIsDepModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit">Save</Button>
                    </div>
                </Form>
            </Modal>

            {/* Designation Modal */}
            <Modal
                title={editingDesig ? "Edit Designation" : "Add New Designation"}
                open={isDesigModalOpen}
                onCancel={() => setIsDesigModalOpen(false)}
                footer={null}
            >
                <Form
                    form={desigForm}
                    layout="vertical"
                    onFinish={handleDesigSubmit}
                    className="mt-4"
                >
                    <Form.Item
                        name="name"
                        label="Designation Title"
                        rules={[{ required: true, message: 'Please enter title' }]}
                    >
                        <Input placeholder="e.g. Software Engineer" />
                    </Form.Item>
                    <Form.Item
                        name="level"
                        label="Job Level"
                        rules={[{ required: true, message: 'Please enter a level' }]}
                    >
                        <InputNumber className="w-full" min={1} max={10} placeholder="1-10" />
                    </Form.Item>
                    <Form.Item
                        name="departmentId"
                        label="Department"
                        rules={[{ required: true, message: 'Please select a department' }]}
                    >
                        <Select
                            placeholder="Select Department"
                            loading={loadingDeps}
                            options={departments.map(d => ({ label: d.name, value: d.id }))}
                        />
                    </Form.Item>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button onClick={() => setIsDesigModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit">Save</Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
