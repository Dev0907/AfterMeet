import React, { useState } from 'react';
import NeoButton from '../components/ui/NeoButton';
import NeoInput from '../components/ui/NeoInput';
import NeoCard from '../components/ui/NeoCard';
import OtpVerification from '../components/ui/OtpVerification';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { authApi } from '../services/api';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
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

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            setError('Password must be 8+ chars, with Upper, Lower, Number & Special Char.');
            return;
        }

        setIsLoading(true);
        try {
            const { data } = await authApi.signup(formData);
            setPendingUserId(data.userId);
            setShowOtpModal(true);
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
        <div className="min-h-screen bg-neo-yellow flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-10 left-10 w-32 h-32 bg-neo-red border-4 border-black rounded-full mix-blend-multiply filter blur-sm animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-neo-teal border-4 border-black rotate-12 mix-blend-multiply"></div>

            <NeoCard className="max-w-md w-full relative z-10">
                <div className="flex items-center gap-2 mb-6">
                    <Link to="/signin" className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h2 className="text-4xl font-black uppercase">Join Us</h2>
                </div>

                {error && (
                    <div className="bg-neo-red text-white p-3 border-4 border-black font-bold mb-4 shadow-neo-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <NeoInput
                        label="Full Name"
                        name="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                    <NeoInput
                        label="Email Address"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="username"
                    />
                    <div className="flex flex-col gap-1">
                        <NeoInput
                            label="Password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                        />
                        <p className="text-xs font-bold text-black mt-1">
                            * Must be at least 8 chars, incl. 1 uppercase, 1 lowercase, 1 number, 1 special char.
                        </p>
                    </div>

                    <NeoButton type="submit" className="mt-4 bg-neo-teal" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin mr-2" />
                                Creating Account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </NeoButton>
                </form>

                <p className="mt-6 text-center font-bold">
                    Already a member?{' '}
                    <Link to="/signin" className="underline decoration-4 decoration-neo-red hover:decoration-black">
                        Sign In
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

export default Signup;
