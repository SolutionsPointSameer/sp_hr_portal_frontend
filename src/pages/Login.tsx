import { Form, Input, Button, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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

            const { user, accessToken, refreshToken } = response.data;

            login(user, accessToken, refreshToken);
            message.success('Login successful!');

            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        } catch (error: any) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Login failed, please check your credentials.';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex relative overflow-hidden font-sans" style={{ background: '#0f172a' }}>
            {/* Left side — decorative */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
                {/* Gradient background shapes */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1a2a4b 0%, #0f172a 50%, #1a1a2e 100%)' }}></div>
                <div className="absolute top-[15%] left-[10%] w-[30vw] h-[30vw] rounded-full opacity-40" style={{ background: 'radial-gradient(circle, #E00C05 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
                <div className="absolute bottom-[10%] right-[15%] w-[25vw] h-[25vw] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
                <div className="absolute top-[60%] left-[40%] w-[15vw] h-[15vw] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(60px)' }}></div>

                {/* Content */}
                <div className="relative z-10 text-center px-12 max-w-lg">
                    <img src="/assets/LOGO-FOOTER.png" alt="Solutions Point" className="w-24 h-24 mx-auto mb-8 drop-shadow-lg" />
                    <h1 className="text-4xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Solutions Point
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Your complete HR management platform. Streamline employee records, attendance, leaves, and payroll — all in one place.
                    </p>

                    {/* Feature pills */}
                    <div className="flex flex-wrap justify-center gap-3 mt-10">
                        {['Attendance', 'Leave Management', 'Payroll', 'Reports'].map((feature) => (
                            <span
                                key={feature}
                                className="px-4 py-2 rounded-full text-sm font-medium border"
                                style={{ color: '#94a3b8', borderColor: 'rgba(148, 163, 184, 0.2)', background: 'rgba(255,255,255,0.03)' }}
                            >
                                {feature}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right side — login form */}
            <div
                className="flex-1 flex items-center justify-center px-6 sm:px-12 relative"
                style={{ background: '#ffffff' }}
            >
                {/* Subtle decorative dot */}
                <div className="absolute top-8 right-8 w-20 h-20 rounded-full opacity-5" style={{ background: '#E00C05' }}></div>

                <div className="w-full max-w-[420px] animate-fade-in">
                    {/* Mobile-only logo */}
                    <div className="lg:hidden text-center mb-8">
                        <img src="/assets/LOGO.png" alt="Solutions Point" className="w-14 h-14 mx-auto mb-4" />
                    </div>

                    <div className="mb-10">
                        <Title level={2} className="!mb-2 !text-slate-900" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, letterSpacing: '-0.025em' }}>
                            Welcome back
                        </Title>
                        <Text className="text-slate-500 text-base">
                            Sign in to your HR Portal account
                        </Text>
                    </div>

                    <Form
                        name="login_form"
                        layout="vertical"
                        onFinish={onFinish}
                        size="large"
                        requiredMark={false}
                    >
                        <Form.Item
                            name="email"
                            label={<span className="text-slate-600 font-medium text-sm">Email address</span>}
                            rules={[
                                { required: true, message: 'Please enter your email' },
                                { type: 'email', message: 'Please enter a valid email' }
                            ]}
                        >
                            <Input
                                prefix={<UserOutlined className="text-slate-400" />}
                                placeholder="name@solutionspoint.net"
                                className="!rounded-xl !h-12"
                                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
                                autoFocus
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label={<span className="text-slate-600 font-medium text-sm">Password</span>}
                            rules={[{ required: true, message: 'Please enter your password' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined className="text-slate-400" />}
                                placeholder="Enter your password"
                                className="!rounded-xl !h-12"
                                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
                            />
                        </Form.Item>

                        <div className="flex justify-end mb-6">
                            <Link
                                to="/forgot-password"
                                className="text-sm font-medium transition-colors"
                                style={{ color: '#E00C05' }}
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Form.Item className="!mb-0">
                            <Button
                                type="primary"
                                htmlType="submit"
                                className="w-full !h-12 text-[15px] font-semibold tracking-wide !rounded-xl border-0"
                                style={{
                                    background: 'linear-gradient(135deg, #E00C05 0%, #f97316 100%)',
                                    boxShadow: '0 8px 24px rgba(224, 12, 5, 0.25)',
                                }}
                                loading={loading}
                            >
                                Sign In
                            </Button>
                        </Form.Item>
                    </Form>

                    {/* Footer */}
                    <div className="text-center mt-10 text-slate-400 text-xs">
                        &copy; {new Date().getFullYear()} Solutions Point. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
}
