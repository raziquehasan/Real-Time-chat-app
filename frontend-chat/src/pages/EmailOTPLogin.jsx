import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FiMail, FiArrowLeft } from 'react-icons/fi';

const EmailOTPLogin = () => {
    const [email, setEmail] = useState('');
    const [otp, setOTP] = useState(['', '', '', '', '', '']);
    const [step, setStep] = useState('email'); // 'email' or 'verify'
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(120); // 2 minutes
    const navigate = useNavigate();

    // Send OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.sendEmailOTP({ email });
            if (response.success) {
                toast.success('OTP sent to your email!');
                setStep('verify');
                startTimer();
            } else {
                toast.error(response.message || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // Start countdown timer
    const startTimer = () => {
        setTimer(120);
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Handle OTP input
    const handleOTPChange = (index, value) => {
        if (value.length > 1) value = value[0];
        if (!/^\d*$/.test(value)) return;

        const newOTP = [...otp];
        newOTP[index] = value;
        setOTP(newOTP);

        // Auto-focus next input
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    // Handle backspace
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    // Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            toast.error('Please enter complete OTP');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.verifyEmailOTP({ email, otpCode });
            if (response.success) {
                toast.success('Login successful!');
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                navigate('/');
                window.location.reload();
            } else {
                toast.error(response.message || 'Invalid OTP');
                setOTP(['', '', '', '', '', '']);
                document.getElementById('otp-0')?.focus();
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            toast.error(error.response?.data?.message || 'Invalid or expired OTP');
            setOTP(['', '', '', '', '', '']);
            document.getElementById('otp-0')?.focus();
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        if (timer > 0) return;

        setLoading(true);
        try {
            const response = await authAPI.sendEmailOTP({ email });
            if (response.success) {
                toast.success('OTP resent to your email!');
                setOTP(['', '', '', '', '', '']);
                startTimer();
                document.getElementById('otp-0')?.focus();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Email Step */}
                {step === 'email' && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">Email OTP Login</h1>
                            <p className="text-gray-300">We'll send you a verification code</p>
                        </div>

                        <form onSubmit={handleSendOTP}>
                            <div className="mb-6">
                                <label className="block text-white text-sm font-medium mb-2">
                                    Email Address
                                </label>
                                <div className="flex items-center bg-white/20 rounded-lg p-3 border border-white/30 focus-within:border-purple-400 transition">
                                    <FiMail className="text-white mr-2" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 ${loading
                                        ? 'bg-gray-600 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {loading ? 'Sending OTP...' : 'Send OTP'}
                            </button>
                        </form>

                        <div className="text-center mt-6">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                            >
                                ← Back to Login
                            </button>
                        </div>
                    </div>
                )}

                {/* OTP Verification Step */}
                {step === 'verify' && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                        <button
                            onClick={() => setStep('email')}
                            className="text-white mb-4 flex items-center hover:text-purple-300 transition"
                        >
                            <FiArrowLeft className="mr-2" /> Change Email
                        </button>

                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">Verify OTP</h1>
                            <p className="text-gray-300">
                                Code sent to <span className="text-purple-400 font-semibold">{email}</span>
                            </p>
                        </div>

                        <form onSubmit={handleVerifyOTP}>
                            <div className="mb-6">
                                <div className="flex justify-center gap-2 mb-4">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`otp-${index}`}
                                            type="text"
                                            maxLength="1"
                                            value={digit}
                                            onChange={(e) => handleOTPChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            className="w-12 h-14 text-center text-2xl font-bold bg-white/20 text-white rounded-lg border-2 border-white/30 focus:border-purple-400 outline-none transition"
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>

                                <div className="text-center">
                                    {timer > 0 ? (
                                        <p className="text-gray-400 text-sm">
                                            Resend OTP in {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResendOTP}
                                            disabled={loading}
                                            className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                                        >
                                            Resend OTP
                                        </button>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.join('').length !== 6}
                                className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 ${loading || otp.join('').length !== 6
                                        ? 'bg-gray-600 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {loading ? 'Verifying...' : 'Verify & Login'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailOTPLogin;
