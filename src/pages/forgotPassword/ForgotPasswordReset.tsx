import { Form, Input, Button, Card, Typography, App, Progress } from 'antd';
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { apiClient } from '../../api/client';

const { Title, Text } = Typography;

/** Returns a 0-100 score and a label for the given password */
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
    if (!password) return { score: 0, label: '', color: '#e2e8f0' };
    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[0-9]/.test(password)) score += 20;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;

    if (score < 30) return { score, label: 'Weak', color: '#ef4444' };
    if (score < 60) return { score, label: 'Fair', color: '#f97316' };
    if (score < 85) return { score, label: 'Good', color: '#3b82f6' };
    return { score, label: 'Strong', color: '#22c55e' };
}

export default function ForgotPasswordReset() {
    const navigate = useNavigate();
    const location = useLocation();
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [passwordValue, setPasswordValue] = useState('');

    const resetToken = (location.state as { resetToken?: string })?.resetToken;

    // Guard: redirect to screen 1 if no token
    if (!resetToken) {
        return <Navigate to="/forgot-password" replace />;
    }

    const strength = getPasswordStrength(passwordValue);

    const onFinish = async (values: { newPassword: string }) => {
        try {
            setLoading(true);
            await apiClient.post('/auth/reset-password', {
                resetToken,
                newPassword: values.newPassword,
            });
            message.success('✅ Password reset successfully! Redirecting to login...');
            setTimeout(() => navigate('/login', { replace: true }), 2000);
        } catch (error: any) {
            const status = error.response?.status;
            const msg = error.response?.data?.message || error.response?.data?.error || '';
            if (status === 400) {
                if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid token')) {
                    message.error('Reset link has expired. Please start over.');
                } else if (msg.toLowerCase().includes('8 character') || msg.toLowerCase().includes('password')) {
                    message.error('Password must be at least 8 characters.');
                } else {
                    message.error(msg || 'Invalid request. Please start over.');
                }
            } else {
                message.error('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">
            <Card className="w-full max-w-md shadow-2xl border-none">
                <div className="text-center mb-8">
                    <img src="/assets/LOGO.png" alt="Solutions Point" className="h-16 mx-auto mb-4" />
                    <Title level={4} className="text-slate-700 mt-2">Reset Password</Title>
                    <Text className="text-slate-500">
                        Create a new password. This link is valid for 5 minutes.
                    </Text>
                </div>

                <Form
                    form={form}
                    name="reset_password_form"
                    layout="vertical"
                    onFinish={onFinish}
                    size="large"
                >
                    <Form.Item
                        name="newPassword"
                        rules={[
                            { required: true, message: 'Please enter a new password.' },
                            { min: 8, message: 'Password must be at least 8 characters.' },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="text-slate-500" />}
                            placeholder="New Password"
                            autoFocus
                            className="bg-white border-slate-200 text-slate-900"
                            onChange={(e) => setPasswordValue(e.target.value)}
                        />
                    </Form.Item>

                    {/* Password strength indicator */}
                    {passwordValue && (
                        <div className="mb-4 -mt-2">
                            <Progress
                                percent={strength.score}
                                showInfo={false}
                                strokeColor={strength.color}
                                trailColor="#e2e8f0"
                                size="small"
                            />
                            <Text style={{ color: strength.color, fontSize: 12 }}>
                                Strength: {strength.label}
                            </Text>
                        </div>
                    )}

                    <Form.Item
                        name="confirmPassword"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Please confirm your password.' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(
                                        new Error('Passwords do not match.')
                                    );
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="text-slate-500" />}
                            placeholder="Confirm New Password"
                            className="bg-white border-slate-200 text-slate-900"
                        />
                    </Form.Item>

                    <Form.Item className="mb-2">
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="w-full mt-2"
                            size="large"
                            loading={loading}
                        >
                            Reset Password
                        </Button>
                    </Form.Item>
                </Form>

                <div className="text-center mt-4">
                    <Link
                        to="/forgot-password"
                        className="text-slate-500 hover:text-slate-700 inline-flex items-center gap-1 text-sm"
                    >
                        <ArrowLeftOutlined />
                        Start over
                    </Link>
                </div>
            </Card>
        </div>
    );
}
