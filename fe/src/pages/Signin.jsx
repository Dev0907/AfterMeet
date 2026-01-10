import React, { useState } from 'react';
import NeoButton from '../components/ui/NeoButton';
import NeoInput from '../components/ui/NeoInput';
import NeoCard from '../components/ui/NeoCard';
import OtpVerification from '../components/ui/OtpVerification';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { authApi } from '../services/api';

const Signin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [pendingUserId, setPendingUserId] = useState(null);
    const [otpError, setOtpError] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { data } = await authApi.signin(formData);
            localStorage.setItem('userId', data.userId);
            navigate('/teams');
        } catch (err) {
            const response = err.response?.data;
            if (response?.pendingVerification) {
                setPendingUserId(response.userId);
                setShowOtpModal(true);
            } else {
                setError(response?.error || 'Connection failed. Is the server running?');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (otp) => {
        setOtpError(null);
        setIsVerifying(true);

        try {
            const { data } = await authApi.verifyOtp({ userId: pendingUserId, otp });
            localStorage.setItem('userId', data.userId);
            navigate('/teams');
        } catch (err) {
            setOtpError(err.response?.data?.error || 'Verification failed');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            await authApi.resendOtp({ userId: pendingUserId });
        } catch (err) {
            setOtpError(err.response?.data?.error || 'Failed to resend OTP');
        }
    };

    return (
        <div className="min-h-screen bg-neo-teal flex flex-col items-center justify-center p-4">
            <div className="absolute top-0 right-0 p-10">
                <div className="w-20 h-20 bg-neo-teal opacity-50 rounded-full blur-xl"></div>
            </div>

            <NeoCard className="max-w-md w-full border-black shadow-neo">
                <h2 className="text-3xl font-black uppercase mb-6 text-center tracking-tight">
                    Welcome Back
                </h2>

                {error && (
                    <div className="bg-neo-red text-white p-3 border-2 border-black font-bold mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <NeoInput
                        label="Email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="username"
                    />
                    <NeoInput
                        label="Password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        autoComplete="current-password"
                    />

                    <NeoButton type="submit" className="mt-2 bg-black text-black hover:bg-neo-dark border-0" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin mr-2" />
                                Signing In...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </NeoButton>
                </form>

                <p className="mt-6 text-center font-medium text-sm">
                    New here?{' '}
                    <Link to="/signup" className="underline decoration-2 decoration-neo-teal hover:decoration-black font-bold">
                        Create an Account
                    </Link>
                </p>
            </NeoCard>

            {showOtpModal && (
                <OtpVerification
                    email={formData.email}
                    userId={pendingUserId}
                    onVerify={handleVerifyOtp}
                    onResend={handleResendOtp}
                    isLoading={isVerifying}
                    error={otpError}
                />
            )}
        </div>
    );
};

export default Signin;
