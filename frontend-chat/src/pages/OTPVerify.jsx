import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const OTPVerify = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(120); // 2 minutes
    const [canResend, setCanResend] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const phoneNumber = location.state?.phoneNumber;
    const inputRefs = useRef([]);

    // Redirect if no phone number
    useEffect(() => {
        if (!phoneNumber) {
            navigate('/login');
        }
    }, [phoneNumber, navigate]);

    // Countdown timer
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setCanResend(true);
        }
    }, [timer]);

    // Auto-focus first input
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleChange = (index, value) => {
        if (value.length > 1) {
            value = value.slice(0, 1);
        }

        if (!/^\d*$/.test(value)) return; // Only digits

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = pastedData.split('');
        while (newOtp.length < 6) newOtp.push('');
        setOtp(newOtp);

        // Focus last filled input
        const lastIndex = Math.min(pastedData.length, 5);
        inputRefs.current[lastIndex]?.focus();
    };

    const handleVerify = async (e) => {
        e.preventDefault();

        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            toast.error('Please enter complete OTP');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.verifyOTP({ phoneNumber, otp: otpCode });

            if (response.success) {
                toast.success('Login successful!');

                // Store token and user
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));

                // Navigate to chat
                navigate('/chat');
            } else {
                toast.error(response.message || 'Invalid OTP');
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            toast.error(error.response?.data?.message || 'Invalid or expired OTP');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        try {
            const response = await authAPI.sendOTP({ phoneNumber });
            if (response.success) {
                toast.success('OTP resent successfully!');
                setTimer(120);
                setCanResend(false);
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (error) {
            toast.error('Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Verify OTP</h1>
                    <p className="text-gray-300">
                        Enter the 6-digit code sent to
                    </p>
                    <p className="text-purple-400 font-semibold mt-1">
                        +91 {phoneNumber}
                    </p>
                </div>

                {/* OTP Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                    <form onSubmit={handleVerify}>
                        {/* OTP Inputs */}
                        <div className="flex justify-center gap-2 mb-6">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    className="w-12 h-14 text-center text-2xl font-bold bg-white/20 text-white rounded-lg border-2 border-white/30 focus:border-purple-400 focus:outline-none transition"
                                />
                            ))}
                        </div>

                        {/* Timer */}
                        <div className="text-center mb-6">
                            {!canResend ? (
                                <p className="text-gray-300">
                                    Time remaining: <span className="text-purple-400 font-semibold">{formatTime(timer)}</span>
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={loading}
                                    className="text-purple-400 hover:text-purple-300 font-semibold underline"
                                >
                                    Resend OTP
                                </button>
                            )}
                        </div>

                        {/* Verify Button */}
                        <button
                            type="submit"
                            disabled={loading || otp.join('').length !== 6}
                            className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 ${loading || otp.join('').length !== 6
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                                }`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Verifying...
                                </div>
                            ) : (
                                'Verify & Login'
                            )}
                        </button>
                    </form>

                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full mt-4 py-2 text-gray-300 hover:text-white transition"
                    >
                        ← Change Number
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OTPVerify;
