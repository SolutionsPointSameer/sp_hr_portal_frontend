import { useState, useEffect } from 'react';
import {
    Typography, Card, Table, Button, Tabs, Modal, Form,
    Input, InputNumber, Select, message, Space
} from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
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

interface Company {
    id: string;
    name: string;
}

interface Location {
    id: string;
    name: string;
}

export default function MasterDataManagement() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loadingDeps, setLoadingDeps] = useState(false);
    const [loadingDesigs, setLoadingDesigs] = useState(false);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [loadingLocations, setLoadingLocations] = useState(false);

    // Modal states
    const [isDepModalOpen, setIsDepModalOpen] = useState(false);
    const [isDesigModalOpen, setIsDesigModalOpen] = useState(false);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [editingDep, setEditingDep] = useState<Department | null>(null);
    const [editingDesig, setEditingDesig] = useState<Designation | null>(null);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);

    const [depForm] = Form.useForm();
    const [desigForm] = Form.useForm();
    const [companyForm] = Form.useForm();
    const [locationForm] = Form.useForm();

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

    const fetchCompanies = async () => {
        setLoadingCompanies(true);
        try {
            const res = await apiClient.get('/companies');
            setCompanies(res.data);
        } catch (error) {
            message.error('Failed to load companies');
        } finally {
            setLoadingCompanies(false);
        }
    };

    const fetchLocations = async () => {
        setLoadingLocations(true);
        try {
            const res = await apiClient.get('/locations');
            setLocations(res.data);
        } catch (error) {
            message.error('Failed to load locations');
        } finally {
            setLoadingLocations(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
        fetchDesignations();
        fetchCompanies();
        fetchLocations();
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

    // Company Handlers
    const handleCompanySubmit = async (values: any) => {
        try {
            if (editingCompany) {
                await apiClient.patch(`/companies/${editingCompany.id}`, values);
                message.success('Company updated successfully');
            } else {
                await apiClient.post('/companies', values);
                message.success('Company added successfully');
            }
            setIsCompanyModalOpen(false);
            companyForm.resetFields();
            setEditingCompany(null);
            fetchCompanies();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to save company');
        }
    };

    const openEditCompanyModal = (record: Company) => {
        setEditingCompany(record);
        companyForm.setFieldsValue({ name: record.name });
        setIsCompanyModalOpen(true);
    };

    // Location Handlers
    const handleLocationSubmit = async (values: any) => {
        try {
            if (editingLocation) {
                await apiClient.patch(`/locations/${editingLocation.id}`, values);
                message.success('Location updated successfully');
            } else {
                await apiClient.post('/locations', values);
                message.success('Location added successfully');
            }
            setIsLocationModalOpen(false);
            locationForm.resetFields();
            setEditingLocation(null);
            fetchLocations();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to save location');
        }
    };

    const openEditLocationModal = (record: Location) => {
        setEditingLocation(record);
        locationForm.setFieldsValue({ name: record.name });
        setIsLocationModalOpen(true);
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

    const companyColumns = [
        { title: 'Company Name', dataIndex: 'name', key: 'name', className: 'font-medium' },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_: any, record: Company) => (
                <Space>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openEditCompanyModal(record)}
                    >
                        Edit
                    </Button>
                </Space>
            )
        }
    ];

    const locationColumns = [
        { title: 'Location Name', dataIndex: 'name', key: 'name', className: 'font-medium' },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_: any, record: Location) => (
                <Space>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openEditLocationModal(record)}
                    >
                        Edit
                    </Button>
                </Space>
            )
        }
    ];

    const tabItems = [
        {
            key: 'departments',
            label: 'Departments',
            children: (
                <Card bordered={false} className="shadow-none p-0">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <Title level={4} className="!mb-0">Departments</Title>
                            <Text className="text-slate-400 text-xs">Total {departments.length} departments recorded</Text>
                        </div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingDep(null);
                                depForm.resetFields();
                                setIsDepModalOpen(true);
                            }}
                            className="bg-[#e00c05] hover:bg-[#c00a04]"
                        >
                            Add New
                        </Button>
                    </div>
                    <Table
                        columns={depColumns}
                        dataSource={departments}
                        rowKey="id"
                        loading={loadingDeps}
                        pagination={{ pageSize: 10, size: 'small' }}
                        className="custom-table"
                    />
                </Card>
            )
        },
        {
            key: 'designations',
            label: 'Designations',
            children: (
                <Card bordered={false} className="shadow-none p-0">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <Title level={4} className="!mb-0">Designations</Title>
                            <Text className="text-slate-400 text-xs">Total {designations.length} designations recorded</Text>
                        </div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingDesig(null);
                                desigForm.resetFields();
                                setIsDesigModalOpen(true);
                            }}
                            className="bg-[#e00c05] hover:bg-[#c00a04]"
                        >
                            Add New
                        </Button>
                    </div>
                    <Table
                        columns={desigColumns}
                        dataSource={designations}
                        rowKey="id"
                        loading={loadingDesigs}
                        pagination={{ pageSize: 10, size: 'small' }}
                        className="custom-table"
                    />
                </Card>
            )
        },
        {
            key: 'companies',
            label: 'Companies',
            children: (
                <Card bordered={false} className="shadow-none p-0">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <Title level={4} className="!mb-0">Companies</Title>
                            <Text className="text-slate-400 text-xs">Total {companies.length} companies recorded</Text>
                        </div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingCompany(null);
                                companyForm.resetFields();
                                setIsCompanyModalOpen(true);
                            }}
                            className="bg-[#e00c05] hover:bg-[#c00a04]"
                        >
                            Add New
                        </Button>
                    </div>
                    <Table
                        columns={companyColumns}
                        dataSource={companies}
                        rowKey="id"
                        loading={loadingCompanies}
                        pagination={{ pageSize: 10, size: 'small' }}
                        className="custom-table"
                    />
                </Card>
            )
        },
        {
            key: 'locations',
            label: 'Locations',
            children: (
                <Card bordered={false} className="shadow-none p-0">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <Title level={4} className="!mb-0">Locations</Title>
                            <Text className="text-slate-400 text-xs">Total {locations.length} locations recorded</Text>
                        </div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingLocation(null);
                                locationForm.resetFields();
                                setIsLocationModalOpen(true);
                            }}
                            className="bg-[#e00c05] hover:bg-[#c00a04]"
                        >
                            Add New
                        </Button>
                    </div>
                    <Table
                        columns={locationColumns}
                        dataSource={locations}
                        rowKey="id"
                        loading={loadingLocations}
                        pagination={{ pageSize: 10, size: 'small' }}
                        className="custom-table"
                    />
                </Card>
            )
        }
    ];

    return (
        <div className="p-4 sm:p-8 space-y-8 animate-fade-in max-w-[1400px] mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Title level={2} className="!mb-1 page-heading" style={{ color: '#26428b' }}>
                        Master Data Management
                    </Title>
                    <Text className="text-slate-500">Configure foundational entities like departments, designations, and locations.</Text>
                </div>
            </div>

            <Card 
                className="shadow-xl border-slate-100 rounded-2xl overflow-hidden" 
                style={{ borderRadius: '16px', boxShadow: '0 20px 50px -12px rgba(38, 66, 139, 0.08)' }}
                bodyStyle={{ padding: '0' }}
            >
                <Tabs
                    defaultActiveKey="departments"
                    className="master-data-tabs"
                    items={tabItems}
                />
            </Card>

            {/* Modals */}
            <Modal
                title={editingDep ? "Edit Department" : "Add New Department"}
                open={isDepModalOpen}
                onCancel={() => setIsDepModalOpen(false)}
                footer={null}
                className="custom-modal"
                styles={{ mask: { backdropFilter: 'blur(4px)' } }}
            >
                <Form form={depForm} layout="vertical" onFinish={handleDepSubmit} className="mt-4" size="large">
                    <Form.Item
                        name="name"
                        label={<span className="text-slate-600 font-medium">Department Name</span>}
                        rules={[{ required: true, message: 'Please enter department name' }]}
                    >
                        <Input placeholder="e.g. Engineering" className="!rounded-xl" />
                    </Form.Item>
                    <div className="flex justify-end gap-3 mt-8">
                        <Button onClick={() => setIsDepModalOpen(false)} className="!rounded-xl h-11 px-6">Cancel</Button>
                        <Button type="primary" htmlType="submit" className="!rounded-xl h-11 px-8 bg-[#e00c05]">Save Changes</Button>
                    </div>
                </Form>
            </Modal>

            <Modal
                title={editingDesig ? "Edit Designation" : "Add New Designation"}
                open={isDesigModalOpen}
                onCancel={() => setIsDesigModalOpen(false)}
                footer={null}
                className="custom-modal"
                styles={{ mask: { backdropFilter: 'blur(4px)' } }}
            >
                <Form form={desigForm} layout="vertical" onFinish={handleDesigSubmit} className="mt-4" size="large">
                    <Form.Item
                        name="name"
                        label={<span className="text-slate-600 font-medium">Designation Title</span>}
                        rules={[{ required: true, message: 'Please enter title' }]}
                    >
                        <Input placeholder="e.g. Software Engineer" className="!rounded-xl" />
                    </Form.Item>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="level"
                            label={<span className="text-slate-600 font-medium">Job Level</span>}
                            rules={[{ required: true, message: 'Please enter level' }]}
                        >
                            <InputNumber className="w-full !rounded-xl" min={1} max={10} placeholder="1-10" />
                        </Form.Item>
                        <Form.Item
                            name="departmentId"
                            label={<span className="text-slate-600 font-medium">Department</span>}
                            rules={[{ required: true, message: 'Select department' }]}
                        >
                            <Select
                                placeholder="Select"
                                className="!rounded-xl"
                                loading={loadingDeps}
                                options={departments.map(d => ({ label: d.name, value: d.id }))}
                            />
                        </Form.Item>
                    </div>
                    <div className="flex justify-end gap-3 mt-8">
                        <Button onClick={() => setIsDesigModalOpen(false)} className="!rounded-xl h-11 px-6">Cancel</Button>
                        <Button type="primary" htmlType="submit" className="!rounded-xl h-11 px-8 bg-[#e00c05]">Save Changes</Button>
                    </div>
                </Form>
            </Modal>

            <Modal
                title={editingCompany ? "Edit Company" : "Add New Company"}
                open={isCompanyModalOpen}
                onCancel={() => setIsCompanyModalOpen(false)}
                footer={null}
                className="custom-modal"
                styles={{ mask: { backdropFilter: 'blur(4px)' } }}
            >
                <Form form={companyForm} layout="vertical" onFinish={handleCompanySubmit} className="mt-4" size="large">
                    <Form.Item
                        name="name"
                        label={<span className="text-slate-600 font-medium">Company Name</span>}
                        rules={[{ required: true, message: 'Please enter company name' }]}
                    >
                        <Input placeholder="e.g. Acme Corp" className="!rounded-xl" />
                    </Form.Item>
                    <div className="flex justify-end gap-3 mt-8">
                        <Button onClick={() => setIsCompanyModalOpen(false)} className="!rounded-xl h-11 px-6">Cancel</Button>
                        <Button type="primary" htmlType="submit" className="!rounded-xl h-11 px-8 bg-[#e00c05]">Save Changes</Button>
                    </div>
                </Form>
            </Modal>

            <Modal
                title={editingLocation ? "Edit Location" : "Add New Location"}
                open={isLocationModalOpen}
                onCancel={() => setIsLocationModalOpen(false)}
                footer={null}
                className="custom-modal"
                styles={{ mask: { backdropFilter: 'blur(4px)' } }}
            >
                <Form form={locationForm} layout="vertical" onFinish={handleLocationSubmit} className="mt-4" size="large">
                    <Form.Item
                        name="name"
                        label={<span className="text-slate-600 font-medium">Location Name</span>}
                        rules={[{ required: true, message: 'Please enter location name' }]}
                    >
                        <Input placeholder="e.g. New York, NY" className="!rounded-xl" />
                    </Form.Item>
                    <div className="flex justify-end gap-3 mt-8">
                        <Button onClick={() => setIsLocationModalOpen(false)} className="!rounded-xl h-11 px-6">Cancel</Button>
                        <Button type="primary" htmlType="submit" className="!rounded-xl h-11 px-8 bg-[#e00c05]">Save Changes</Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
