
import React, { useState, useRef, useEffect } from 'react';
import NeoButton from './NeoButton';
import { Loader2, RefreshCw, Mail, ShieldCheck } from 'lucide-react';

/**
 * OtpVerification - 6-digit OTP input component with auto-focus and resend functionality
 */
const OtpVerification = ({
    email,
    userId,
    onVerify,
    onResend,
    isLoading = false,
    error = null,
}) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isResending, setIsResending] = useState(false);
    const inputRefs = useRef([]);

    // Focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all digits entered
        if (value && index === 5 && newOtp.every(d => d !== '')) {
            onVerify(newOtp.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            // Move to previous input on backspace if current is empty
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData) {
            const newOtp = pastedData.split('');
            while (newOtp.length < 6) newOtp.push('');
            setOtp(newOtp);

            // Focus last filled input or submit
            const lastIndex = Math.min(pastedData.length, 5);
            inputRefs.current[lastIndex]?.focus();

            if (pastedData.length === 6) {
                onVerify(pastedData);
            }
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || isResending) return;

        setIsResending(true);
        try {
            await onResend();
            setResendCooldown(60); // 60 second cooldown
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsResending(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length === 6) {
            onVerify(otpString);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white border-4 border-black shadow-neo max-w-md w-full">
                {/* Header */}
                <div className="bg-neo-teal border-b-4 border-black p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white border-4 border-black flex items-center justify-center">
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-2xl font-black uppercase">Verify Your Email</h2>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-center font-medium mb-2">
                        We sent a 6-digit code to
                    </p>
                    <p className="text-center font-black mb-6 flex items-center justify-center gap-2">
                        <Mail size={18} />
                        {email}
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* OTP Input Boxes */}
                        <div className="flex justify-center gap-2 mb-6">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => inputRefs.current[index] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePaste : undefined}
                                    disabled={isLoading}
                                    className={`
                                        w-12 h-14 text-center text-2xl font-black
                                        border-4 border-black bg-neo-white
                                        focus:bg-neo-yellow focus:outline-none
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        transition-colors
                                    `}
                                />
                            ))}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-neo-red border-2 border-black text-center font-bold text-sm">
                                {error}
                            </div>
                        )}

                        {/* Verify Button */}
                        <NeoButton
                            type="submit"
                            className="w-full bg-neo-yellow"
                            disabled={isLoading || otp.some(d => d === '')}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin mr-2" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify Email'
                            )}
                        </NeoButton>
                    </form>

                    {/* Resend Section */}
                    <div className="mt-6 text-center">
                        <p className="text-sm font-medium text-gray-600 mb-2">
                            Didn't receive the code?
                        </p>
                        <button
                            onClick={handleResend}
                            disabled={resendCooldown > 0 || isResending}
                            className={`
                                inline-flex items-center gap-2 font-bold text-sm
                                ${resendCooldown > 0
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-black hover:underline cursor-pointer'
                                }
                            `}
                        >
                            {isResending ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Sending...
                                </>
                            ) : resendCooldown > 0 ? (
                                <>
                                    <RefreshCw size={14} />
                                    Resend in {resendCooldown}s
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={14} />
                                    Resend Code
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t-2 border-black p-4 bg-neo-white text-center">
                    <p className="text-xs font-medium text-gray-500">
                        Code expires in 10 minutes
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OtpVerification;
