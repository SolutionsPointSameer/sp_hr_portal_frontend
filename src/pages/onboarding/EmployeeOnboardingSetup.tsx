import { useState } from 'react';
import { Typography, Card, Steps, Form, Input, Button, Upload, message, Result } from 'antd';
import { UploadOutlined, LockOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../api/client';

const { Title, Text } = Typography;

export default function EmployeeOnboardingSetup() {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { user, login, accessToken, refreshToken } = useAuthStore();

    const [aadhaarFile, setAadhaarFile] = useState<any>(null);
    const [panFile, setPanFile] = useState<any>(null);

    // Step 1: Change Password
    const handlePasswordSubmit = async (values: any) => {
        setLoading(true);
        try {
            await apiClient.post('/auth/change-password', {
                oldPassword: values.oldPassword,
                newPassword: values.newPassword
            });

            message.success('Password updated successfully!');
            setCurrentStep(1);
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Upload Documents
    const handleDocumentSubmit = async () => {
        if (!aadhaarFile && !panFile) {
            message.warning('Please select at least one document to upload.');
            return;
        }

        setLoading(true);
        try {
            // Upload Aadhaar if present
            if (aadhaarFile) {
                const formData = new FormData();
                formData.append('file', aadhaarFile);
                formData.append('type', 'AADHAAR_CARD');
                await apiClient.post('/employees/me/documents', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            // Upload PAN if present
            if (panFile) {
                const formData = new FormData();
                formData.append('file', panFile);
                formData.append('type', 'PAN_CARD');
                await apiClient.post('/employees/me/documents', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            // Final step: update the user's requiresOnboarding flag to false in the backend
            await apiClient.patch(`/employees/${user?.id}/onboarding-complete`);

            // Update local store so the guard lets them into the dashboard
            if (user && accessToken && refreshToken) {
                login({ ...user, requiresOnboarding: false }, accessToken, refreshToken);
            }

            setCurrentStep(2);
        } catch (error) {
            console.error('Document upload error:', error);
            message.error('Failed to upload documents');
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        navigate('/dashboard');
    };

    const steps = [
        { title: 'Update Password', icon: <LockOutlined /> },
        { title: 'Upload Documents', icon: <FileTextOutlined /> },
        { title: 'Complete', icon: <CheckCircleOutlined /> }
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-3xl">
                <div className="text-center mb-10">
                    <img src="/assets/LOGO.png" alt="Solutions Point" className="h-16 mx-auto mb-6" />
                    <Title level={2} className="!mb-2 text-slate-800">Welcome to Solutions Point, {user?.firstName}!</Title>
                    <Text className="text-slate-500 text-lg">Let's get your account set up.</Text>
                </div>

                <Card className="shadow-lg border-none rounded-xl p-2">
                    <Steps current={currentStep} items={steps} className="mb-10" />

                    {/* STEP 1: Password */}
                    {currentStep === 0 && (
                        <div className="max-w-md mx-auto py-4">
                            <Title level={4} className="mb-6 text-center">Set your new password</Title>
                            <Form form={form} layout="vertical" onFinish={handlePasswordSubmit} size="large">
                                <Form.Item
                                    name="oldPassword"
                                    label="Current / Temporary Password"
                                    rules={[{ required: true, message: 'Please enter your current password' }]}
                                >
                                    <Input.Password placeholder="Enter current password" />
                                </Form.Item>
                                <Form.Item
                                    name="newPassword"
                                    label="New Password"
                                    rules={[
                                        { required: true, message: 'Please enter a new password' },
                                        { min: 8, message: 'Password must be at least 8 characters' }
                                    ]}
                                >
                                    <Input.Password placeholder="Enter new password" />
                                </Form.Item>
                                <Form.Item
                                    name="confirmPassword"
                                    label="Confirm New Password"
                                    dependencies={['newPassword']}
                                    rules={[
                                        { required: true, message: 'Please confirm your new password' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('newPassword') === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error('The two passwords do not match!'));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password placeholder="Confirm new password" />
                                </Form.Item>
                                <Button type="primary" htmlType="submit" className="w-full mt-4" loading={loading}>
                                    Update Password & Continue
                                </Button>
                            </Form>
                        </div>
                    )}

                    {/* STEP 2: Documents */}
                    {currentStep === 1 && (
                        <div className="max-w-lg mx-auto py-4">
                            <Title level={4} className="mb-6 text-center">Upload Required Documents</Title>
                            <div className="flex flex-col gap-6 mb-8">
                                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex justify-between items-center">
                                    <div>
                                        <div className="font-medium text-slate-800">Aadhaar Card</div>
                                        <div className="text-xs text-slate-500">Front and back (PDF or Image)</div>
                                    </div>
                                    <Upload
                                        maxCount={1}
                                        beforeUpload={(file) => {
                                            setAadhaarFile(file);
                                            return false;
                                        }}
                                        onRemove={() => setAadhaarFile(null)}
                                        fileList={aadhaarFile ? [aadhaarFile] : []}
                                    >
                                        <Button icon={<UploadOutlined />}>Select File</Button>
                                    </Upload>
                                </div>
                                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex justify-between items-center">
                                    <div>
                                        <div className="font-medium text-slate-800">PAN Card</div>
                                        <div className="text-xs text-slate-500">Front side only (PDF or Image)</div>
                                    </div>
                                    <Upload
                                        maxCount={1}
                                        beforeUpload={(file) => {
                                            setPanFile(file);
                                            return false;
                                        }}
                                        onRemove={() => setPanFile(null)}
                                        fileList={panFile ? [panFile] : []}
                                    >
                                        <Button icon={<UploadOutlined />}>Select File</Button>
                                    </Upload>
                                </div>
                            </div>
                            <Button type="primary" size="large" className="w-full" onClick={handleDocumentSubmit} loading={loading}>
                                Submit Documents
                            </Button>
                        </div>
                    )}

                    {/* STEP 3: Complete */}
                    {currentStep === 2 && (
                        <div className="py-8">
                            <Result
                                status="success"
                                title={<span className="text-slate-800">Setup Complete!</span>}
                                subTitle={<span className="text-slate-500 text-base">Your profile has been fully configured. Welcome aboard!</span>}
                                extra={[
                                    <Button type="primary" size="large" key="console" onClick={handleFinish} className="px-8 mt-4">
                                        Go to Dashboard
                                    </Button>,
                                ]}
                            />
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
