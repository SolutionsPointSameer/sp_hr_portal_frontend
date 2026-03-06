import { Form, Input, Button, Card, Typography, App } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../../api/client';

const { Title, Text } = Typography;

const OTP_EXPIRY_SECONDS = 10 * 60; // 10 minutes
const RESEND_COOLDOWN_SECONDS = 60;

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ForgotPasswordVerify() {
    const navigate = useNavigate();
    const location = useLocation();
    const { message } = App.useApp();
    const [form] = Form.useForm();

    const email = (location.state as { email?: string })?.email;

    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    // OTP expiry countdown (10 min)
    const [otpSecondsLeft, setOtpSecondsLeft] = useState(OTP_EXPIRY_SECONDS);
    // Resend cooldown (60 sec)
    const [resendCooldown, setResendCooldown] = useState(0);

    const otpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startOtpTimer = useCallback(() => {
        if (otpTimerRef.current) clearInterval(otpTimerRef.current);
        setOtpSecondsLeft(OTP_EXPIRY_SECONDS);
        otpTimerRef.current = setInterval(() => {
            setOtpSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(otpTimerRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const startResendCooldown = useCallback(() => {
        if (resendTimerRef.current) clearInterval(resendTimerRef.current);
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        resendTimerRef.current = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(resendTimerRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => {
        startOtpTimer();
        return () => {
            if (otpTimerRef.current) clearInterval(otpTimerRef.current);
            if (resendTimerRef.current) clearInterval(resendTimerRef.current);
        };
    }, [startOtpTimer]);

    // Redirect if no email in state
    if (!email) {
        return <Navigate to="/forgot-password" replace />;
    }

    const onFinish = async (values: { otp: string }) => {
        try {
            setLoading(true);
            const response = await apiClient.post('/auth/verify-otp', {
                email,
                otp: values.otp,
            });
            const { resetToken } = response.data;
            navigate('/forgot-password/reset', { state: { resetToken } });
        } catch (error: any) {
            const status = error.response?.status;
            if (status === 400) {
                message.error('Invalid or expired OTP. Please try again.');
            } else if (status === 429) {
                message.error('Too many attempts. Please request a new OTP.');
            } else {
                message.error('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || resendLoading) return;
        try {
            setResendLoading(true);
            await apiClient.post('/auth/forgot-password', { email });
            message.success('A new OTP has been sent to your email.');
            form.resetFields();
            startOtpTimer();
            startResendCooldown();
        } catch {
            message.error('Failed to resend OTP. Please try again.');
        } finally {
            setResendLoading(false);
        }
    };

    const otpExpired = otpSecondsLeft === 0;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">
            <Card className="w-full max-w-md shadow-2xl border-none">
                <div className="text-center mb-8">
                    <img src="/assets/LOGO.png" alt="Solutions Point" className="h-16 mx-auto mb-4" />
                    <Title level={4} className="text-slate-700 mt-2">Verify OTP</Title>
                    <Text className="text-slate-500">
                        We sent a 6-digit OTP to <strong>{email}</strong>
                    </Text>
                </div>

                {/* Countdown timer */}
                <div className={`text-center mb-6 font-medium text-sm ${otpExpired ? 'text-red-500' : 'text-slate-500'}`}>
                    {otpExpired
                        ? '⚠️ OTP has expired. Please request a new one.'
                        : `OTP expires in: ${formatTime(otpSecondsLeft)}`}
                </div>

                <Form
                    form={form}
                    name="verify_otp_form"
                    layout="vertical"
                    onFinish={onFinish}
                    size="large"
                >
                    <Form.Item
                        name="otp"
                        rules={[
                            { required: true, message: 'Please enter the OTP.' },
                            {
                                pattern: /^\d{6}$/,
                                message: 'OTP must be exactly 6 digits.',
                            },
                        ]}
                    >
                        <Input
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            inputMode="numeric"
                            autoFocus
                            className="bg-white border-slate-200 text-slate-900 text-center tracking-[0.5em] text-lg font-semibold"
                        />
                    </Form.Item>

                    <Form.Item className="mb-2">
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="w-full mt-2"
                            size="large"
                            loading={loading}
                            disabled={otpExpired}
                        >
                            Verify OTP
                        </Button>
                    </Form.Item>
                </Form>

                {/* Resend OTP */}
                <div className="text-center mt-2">
                    <Button
                        type="link"
                        icon={<ReloadOutlined />}
                        onClick={handleResend}
                        loading={resendLoading}
                        disabled={resendCooldown > 0}
                        className="text-sm"
                    >
                        {resendCooldown > 0
                            ? `Resend OTP in ${resendCooldown}s`
                            : 'Resend OTP'}
                    </Button>
                </div>

                <div className="text-center mt-4">
                    <Link
                        to="/forgot-password"
                        className="text-slate-500 hover:text-slate-700 inline-flex items-center gap-1 text-sm"
                    >
                        <ArrowLeftOutlined />
                        Change email
                    </Link>
                </div>
            </Card>
        </div>
    );
}
