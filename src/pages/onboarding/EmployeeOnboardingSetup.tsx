import { useState } from 'react';
import { Typography, Card, Steps, Form, Input, Button, Upload, Result, App } from 'antd';
import { UploadOutlined, LockOutlined, FileTextOutlined, CheckCircleOutlined, RocketOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { apiClient } from '../../api/client';

const { Title, Text } = Typography;
const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const DOCUMENT_ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png';

export default function EmployeeOnboardingSetup() {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { user, login, accessToken, refreshToken } = useAuthStore();
    const { message: antMessage } = App.useApp();

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

            antMessage.success('Password updated successfully!');
            setCurrentStep(1);
        } catch (error: any) {
            antMessage.error(error.response?.data?.error || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Upload Documents
    const handleDocumentSubmit = async () => {
        if (!aadhaarFile && !panFile) {
            antMessage.warning('Please select at least one document to upload.');
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

            // Final step: update the user's requiresOnboarding flag to false
            await apiClient.patch(`/employees/${user?.id}/onboarding-complete`);

            // Update local store
            if (user && accessToken && refreshToken) {
                login({ ...user, requiresOnboarding: false }, accessToken, refreshToken);
            }

            setCurrentStep(2);
        } catch (error) {
            console.error('Document upload error:', error);
            antMessage.error('Failed to upload documents');
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        navigate('/dashboard');
    };

    const validateDocument = (file: File) => {
        if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
            antMessage.error('Only PDF, DOC, DOCX, JPG, and PNG files are allowed.');
            return Upload.LIST_IGNORE;
        }

        if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
            antMessage.error('Each document must be 10 MB or smaller.');
            return Upload.LIST_IGNORE;
        }

        return false;
    };

    const steps = [
        { title: 'Security', icon: <LockOutlined /> },
        { title: 'Verification', icon: <FileTextOutlined /> },
        { title: 'Ready', icon: <RocketOutlined /> }
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full opacity-[0.03]" style={{ background: '#26428b' }}></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] rounded-full opacity-[0.03]" style={{ background: '#e00c05' }}></div>

            <div className="w-full max-w-2xl z-10 animate-fade-in text-center">
                <div className="mb-12">
                    <img src="/assets/LOGO.png" alt="Solutions Point" className="h-20 mx-auto mb-8 drop-shadow-sm" />
                    <Title level={2} className="!mb-3 !text-slate-800 page-heading" style={{ color: '#26428b' }}>
                        Welcome to Solutions Point, {user?.firstName}!
                    </Title>
                    <Text className="text-slate-500 text-lg">Let's get your professional account ready in a few steps.</Text>
                </div>

                <Card 
                    bordered={false} 
                    className="shadow-xl rounded-2xl p-6 sm:p-10 text-left"
                    style={{ boxShadow: '0 20px 50px -12px rgba(38, 66, 139, 0.12)' }}
                >
                    <Steps 
                        current={currentStep} 
                        items={steps} 
                        className="mb-12 custom-steps"
                        size="small"
                    />

                    {/* STEP 1: Password */}
                    {currentStep === 0 && (
                        <div className="animate-scale-in">
                            <div className="mb-8">
                                <Title level={4} className="!mb-1">Secure your account</Title>
                                <Text className="text-slate-400">Please update your temporary password to continue.</Text>
                            </div>
                            
                            <Form form={form} layout="vertical" onFinish={handlePasswordSubmit} size="large" requiredMark={false}>
                                <Form.Item
                                    name="oldPassword"
                                    label={<span className="text-slate-600 font-medium">Temporary Password</span>}
                                    rules={[{ required: true, message: 'Please enter your current password' }]}
                                >
                                    <Input.Password placeholder="••••••••" className="!rounded-xl" />
                                </Form.Item>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Form.Item
                                        name="newPassword"
                                        label={<span className="text-slate-600 font-medium">New Password</span>}
                                        rules={[
                                            { required: true, message: 'Please enter a new password' },
                                            { min: 8, message: 'Minimum 8 characters required' }
                                        ]}
                                    >
                                        <Input.Password placeholder="••••••••" className="!rounded-xl" />
                                    </Form.Item>
                                    <Form.Item
                                        name="confirmPassword"
                                        label={<span className="text-slate-600 font-medium">Confirm Password</span>}
                                        dependencies={['newPassword']}
                                        rules={[
                                            { required: true, message: 'Please confirm password' },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || getFieldValue('newPassword') === value) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error('Passwords do not match'));
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password placeholder="••••••••" className="!rounded-xl" />
                                    </Form.Item>
                                </div>

                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    className="w-full mt-6 !h-12 text-base font-semibold !rounded-xl" 
                                    style={{ background: '#e00c05', boxShadow: '0 8px 24px rgba(224, 12, 5, 0.2)' }}
                                    loading={loading}
                                >
                                    Save & Continue
                                </Button>
                            </Form>
                        </div>
                    )}

                    {/* STEP 2: Documents */}
                    {currentStep === 1 && (
                        <div className="animate-scale-in">
                            <div className="mb-8">
                                <Title level={4} className="!mb-1">Identity Verification</Title>
                                <Text className="text-slate-400">Upload your government-issued documents for payroll setup.</Text>
                            </div>

                            <div className="flex flex-col gap-5 mb-10">
                                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 bg-slate-50 hover:bg-slate-100/50 transition-colors flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl">
                                            <FileTextOutlined />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">Aadhaar Card</div>
                                            <div className="text-xs text-slate-500">Front and back (PDF, DOC, DOCX, JPG or PNG, max 10 MB)</div>
                                        </div>
                                    </div>
                                    <Upload
                                        accept={DOCUMENT_ACCEPT}
                                        maxCount={1}
                                        beforeUpload={(file) => {
                                            const validation = validateDocument(file);
                                            if (validation !== false) return validation;
                                            setAadhaarFile(file);
                                            return false;
                                        }}
                                        onRemove={() => setAadhaarFile(null)}
                                        fileList={aadhaarFile ? [aadhaarFile] : []}
                                    >
                                        <Button icon={<UploadOutlined />} className="!rounded-lg">Select</Button>
                                    </Upload>
                                </div>

                                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 bg-slate-50 hover:bg-slate-100/50 transition-colors flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 text-xl">
                                            <FileTextOutlined />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">PAN Card</div>
                                            <div className="text-xs text-slate-500">Front side only (PDF, DOC, DOCX, JPG or PNG, max 10 MB)</div>
                                        </div>
                                    </div>
                                    <Upload
                                        accept={DOCUMENT_ACCEPT}
                                        maxCount={1}
                                        beforeUpload={(file) => {
                                            const validation = validateDocument(file);
                                            if (validation !== false) return validation;
                                            setPanFile(file);
                                            return false;
                                        }}
                                        onRemove={() => setPanFile(null)}
                                        fileList={panFile ? [panFile] : []}
                                    >
                                        <Button icon={<UploadOutlined />} className="!rounded-lg">Select</Button>
                                    </Upload>
                                </div>
                            </div>

                            <Button 
                                type="primary" 
                                size="large" 
                                className="w-full !h-12 text-base font-semibold !rounded-xl" 
                                onClick={handleDocumentSubmit} 
                                loading={loading}
                                style={{ background: '#e00c05', boxShadow: '0 8px 24px rgba(224, 12, 5, 0.2)' }}
                            >
                                Submit All Documents
                            </Button>
                        </div>
                    )}

                    {/* STEP 3: Complete */}
                    {currentStep === 2 && (
                        <div className="py-6 animate-scale-in">
                            <Result
                                icon={<div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 text-green-500"><CheckCircleOutlined /></div>}
                                title={<span className="text-2xl font-bold text-slate-800">Setup Complete!</span>}
                                subTitle={<span className="text-slate-500 text-lg">Everything looks great. Welcome to the Solutions Point family!</span>}
                                extra={[
                                    <Button 
                                        type="primary" 
                                        size="large" 
                                        key="console" 
                                        onClick={handleFinish} 
                                        className="px-12 !h-12 text-base font-semibold !rounded-xl"
                                        style={{ background: '#26428b', boxShadow: '0 8px 24px rgba(38, 66, 139, 0.2)' }}
                                    >
                                        Enter Dashboard
                                    </Button>,
                                ]}
                            />
                        </div>
                    )}
                </Card>
                
                <div className="mt-10 text-slate-400 text-sm">
                    Having trouble? Contact support at <a href="mailto:support@solutionspoint.net" className="text-blue-500 font-medium">support@solutionspoint.net</a>
                </div>
            </div>
        </div>
    );
}
