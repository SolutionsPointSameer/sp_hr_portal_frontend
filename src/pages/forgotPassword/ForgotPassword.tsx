import { Form, Input, Button, Card, Typography, App } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { apiClient } from '../../api/client';

const { Title, Text } = Typography;

export default function ForgotPassword() {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: { email: string }) => {
        try {
            setLoading(true);
            await apiClient.post('/auth/forgot-password', { email: values.email });
            // Always show same message regardless of whether email exists
            message.success('If an account with that email exists, an OTP has been sent.');
            navigate('/forgot-password/verify', { state: { email: values.email } });
        } catch (error: any) {
            const status = error.response?.status;
            if (status === 400) {
                message.error('Please enter a valid email address.');
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
                    <Title level={4} className="text-slate-700 mt-2">Forgot Password</Title>
                    <Text className="text-slate-500">
                        Enter your registered email address and we'll send you an OTP to reset your password.
                    </Text>
                </div>

                <Form
                    name="forgot_password_form"
                    layout="vertical"
                    onFinish={onFinish}
                    size="large"
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please enter your email address.' },
                            { type: 'email', message: 'Please enter a valid email address.' },
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined className="text-slate-500" />}
                            placeholder="Email address"
                            type="email"
                            className="bg-white border-slate-200 text-slate-900"
                            autoFocus
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
                            Send OTP
                        </Button>
                    </Form.Item>
                </Form>

                <div className="text-center mt-4">
                    <Link
                        to="/login"
                        className="text-slate-500 hover:text-slate-700 inline-flex items-center gap-1 text-sm"
                    >
                        <ArrowLeftOutlined />
                        Back to Login
                    </Link>
                </div>
            </Card>
        </div>
    );
}
