import { Typography, Card, Form, Input, Button, TimePicker, Select, Switch, Divider, message } from 'antd';
import { SaveOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export default function SystemSettings() {
    const [form] = Form.useForm();

    const onFinish = (values: any) => {
        console.log('Settings:', values);
        message.success('System settings updated successfully.');
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div>
                    <Title level={3} className="!mb-1">System Settings</Title>
                    <Text className="text-slate-500">Configure global application parameters and policies.</Text>
                </div>
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => form.submit()}
                >
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <Card bordered={false} className="shadow-sm">
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            initialValues={{
                                companyName: 'Solutions Point Pvt. Ltd.',
                                workStartTime: dayjs('09:00', 'HH:mm'),
                                workEndTime: dayjs('18:00', 'HH:mm'),
                                workDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
                                currency: 'inr',
                                emailNotifications: true,
                            }}
                        >
                            <Title level={5} className="!mb-4 text-slate-700">Company Identity</Title>
                            <div className="flex gap-6 mb-6">
                                <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 rounded-lg bg-white cursor-pointer hover:bg-slate-50 transition">
                                    <UploadOutlined className="text-2xl text-slate-500 mb-2" />
                                    <Text className="text-slate-500">Upload Logo</Text>
                                </div>
                                <Form.Item name="companyName" label="Company Name" className="flex-1">
                                    <Input className="bg-white border-slate-200 text-slate-900" />
                                </Form.Item>
                            </div>

                            <Divider className="border-slate-200" />

                            <Title level={5} className="!mb-4 text-slate-700">Working Hours & Days</Title>
                            <div className="flex gap-4">
                                <Form.Item name="workStartTime" label="Start Time" className="flex-1">
                                    <TimePicker format="HH:mm" className="w-full bg-white border-slate-200 text-slate-900" />
                                </Form.Item>
                                <Form.Item name="workEndTime" label="End Time" className="flex-1">
                                    <TimePicker format="HH:mm" className="w-full bg-white border-slate-200 text-slate-900" />
                                </Form.Item>
                            </div>
                            <Form.Item name="workDays" label="Working Days">
                                <Select mode="multiple" className="bg-white">
                                    <Option value="mon">Monday</Option>
                                    <Option value="tue">Tuesday</Option>
                                    <Option value="wed">Wednesday</Option>
                                    <Option value="thu">Thursday</Option>
                                    <Option value="fri">Friday</Option>
                                    <Option value="sat">Saturday</Option>
                                    <Option value="sun">Sunday</Option>
                                </Select>
                            </Form.Item>

                            <Divider className="border-slate-200" />

                            <Title level={5} className="!mb-4 text-slate-700">Localization & System</Title>
                            <div className="flex gap-4">
                                <Form.Item name="currency" label="Default Currency" className="flex-1">
                                    <Select className="bg-white">
                                        <Option value="inr">Indian Rupee (INR)</Option>
                                        <Option value="usd">US Dollar (USD)</Option>
                                        <Option value="eur">Euro (EUR)</Option>
                                    </Select>
                                </Form.Item>
                                <div className="flex-1 pt-8 flex items-center">
                                    <Form.Item name="emailNotifications" valuePropName="checked" className="mb-0 mx-2">
                                        <Switch />
                                    </Form.Item>
                                    <Text className="text-slate-900">Enable Email Notifications</Text>
                                </div>
                            </div>
                        </Form>
                    </Card>
                </div>

                <div className="flex flex-col gap-6">
                    <Card title="Quick Actions" bordered={false} className="shadow-sm">
                        <div className="flex flex-col gap-3">
                            <Button type="default" className="text-left justify-start border-slate-300 bg-slate-50 text-slate-900 hover:border-slate-400">
                                Manage Holiday Calendar
                            </Button>
                            <Button type="default" className="text-left justify-start border-slate-300 bg-slate-50 text-slate-900 hover:border-slate-400">
                                Configure Leave Types
                            </Button>
                            <Button type="default" className="text-left justify-start border-slate-300 bg-slate-50 text-slate-900 hover:border-slate-400">
                                Salary Components Mapping
                            </Button>
                            <Divider className="my-2 border-slate-200" />
                            <Button danger type="default" className="text-left justify-start border-red-200 bg-slate-50 hover:border-red-500">
                                Clear System Cache
                            </Button>
                        </div>
                    </Card>

                    <Card title="System Info" bordered={false} className="shadow-sm">
                        <div className="flex flex-col gap-2 text-sm text-slate-500">
                            <div className="flex justify-between">
                                <span>Version</span>
                                <span className="text-slate-900">1.0.0</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Environment</span>
                                <span className="text-slate-900">Production</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Database Status</span>
                                <span className="text-green-600">Connected</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Last Backup</span>
                                <span className="text-slate-900">Today at 02:00 AM</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
