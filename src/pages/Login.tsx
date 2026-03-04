import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useState } from 'react';
import { apiClient } from '../api/client';

const { Title, Text } = Typography;

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuthStore();
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            const response = await apiClient.post('/auth/login', {
                email: values.email,
                password: values.password
            });

            // The exact structure depends on the backend, assuming { user, accessToken, refreshToken } 
            // is returned by the login endpoint. Adjust if the object shape is slightly different.
            const { user, accessToken, refreshToken } = response.data;

            login(user, accessToken, refreshToken);
            message.success('Login successful!');

            // Redirect to the URL they were trying to access, or dashboard
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        } catch (error: any) {
            console.error('Login error:', error);
            // The backend returns { error: 'Invalid credentials' } instead of { message: ... }
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Login failed, please check your credentials.';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">
            <Card className="w-full max-w-md shadow-2xl border-none">
                <div className="text-center mb-8">
                    <img src="/assets/LOGO.png" alt="Solutions Point" className="h-16 mx-auto mb-4" />
                    <Title level={4} className="text-slate-700 mt-2">Sign in to your account</Title>
                    <Text className="text-slate-500">Welcome to SP HR Management Portal</Text>
                </div>

                <Form
                    name="login_form"
                    layout="vertical"
                    onFinish={onFinish}
                    size="large"
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please input your Email!' },
                            { type: 'email', message: 'Please enter a valid email!' }
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined className="text-slate-500" />}
                            placeholder="Email address"
                            className="bg-white border-slate-200 text-slate-900"
                            autoFocus
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your Password!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="text-slate-500" />}
                            placeholder="Password"
                            className="bg-white border-slate-200 text-slate-900"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="w-full mt-4"
                            size="large"
                            loading={loading}
                        >
                            Sign In
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
