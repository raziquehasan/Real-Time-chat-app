import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import chatIcon from '../assets/chat.png';
import { FiMail, FiLock, FiPhone } from 'react-icons/fi';

const Login = () => {
    const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        phoneNumber: ''
    });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authAPI.login(formData.email, formData.password);
            login(response.token, response.user);
            toast.success('Login successful!');
            navigate('/');
        } catch (error) {
            console.error('Login error:', error);
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneLogin = async (e) => {
        e.preventDefault();

        if (!formData.phoneNumber || formData.phoneNumber.length !== 10) {
            toast.error('Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.sendOTP({ phoneNumber: formData.phoneNumber });
            if (response.success) {
                toast.success('OTP sent successfully!');
                navigate('/verify-otp', { state: { phoneNumber: formData.phoneNumber } });
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo Section */}
                <div className="text-center mb-8">
                    <img src={chatIcon} className="w-16 h-16 mx-auto mb-4" alt="Chat Icon" />
                    <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-gray-300">Sign in to continue your conversations</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                    {/* Login Method Toggle */}
                    <div className="flex gap-2 mb-6 bg-white/5 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => setLoginMethod('email')}
                            className={`flex-1 py-2 rounded-lg font-semibold transition ${loginMethod === 'email'
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                    : 'text-gray-300 hover:text-white'
                                }`}
                        >
                            Email
                        </button>
                        <button
                            type="button"
                            onClick={() => setLoginMethod('phone')}
                            className={`flex-1 py-2 rounded-lg font-semibold transition ${loginMethod === 'phone'
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                    : 'text-gray-300 hover:text-white'
                                }`}
                        >
                            Phone
                        </button>
                    </div>

                    {/* Email Login Form */}
                    {loginMethod === 'email' && (
                        <form onSubmit={handleEmailLogin}>
                            {/* Email Input */}
                            <div className="mb-4">
                                <label className="block text-white text-sm font-medium mb-2">
                                    Email Address
                                </label>
                                <div className="flex items-center bg-white/20 rounded-lg p-3 border border-white/30 focus-within:border-purple-400 transition">
                                    <FiMail className="text-white mr-2" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="your@email.com"
                                        className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="mb-6">
                                <label className="block text-white text-sm font-medium mb-2">
                                    Password
                                </label>
                                <div className="flex items-center bg-white/20 rounded-lg p-3 border border-white/30 focus-within:border-purple-400 transition">
                                    <FiLock className="text-white mr-2" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 ${loading
                                        ? 'bg-gray-600 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    )}

                    {/* Phone Login Form */}
                    {loginMethod === 'phone' && (
                        <form onSubmit={handlePhoneLogin}>
                            {/* Phone Input */}
                            <div className="mb-6">
                                <label className="block text-white text-sm font-medium mb-2">
                                    Phone Number
                                </label>
                                <div className="flex items-center bg-white/20 rounded-lg p-3 border border-white/30 focus-within:border-purple-400 transition">
                                    <span className="text-white font-medium mr-2">+91</span>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            if (value.length <= 10) {
                                                setFormData({ ...formData, phoneNumber: value });
                                            }
                                        }}
                                        placeholder="9876543210"
                                        className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
                                        maxLength={10}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <p className="text-gray-400 text-xs mt-2">
                                    We'll send you a 6-digit OTP
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || formData.phoneNumber.length !== 10}
                                className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 ${loading || formData.phoneNumber.length !== 10
                                        ? 'bg-gray-600 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {loading ? 'Sending OTP...' : 'Send OTP'}
                            </button>
                        </form>
                    )}

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-transparent text-gray-400">OR</span>
                        </div>
                    </div>

                    {/* Register Link */}
                    <div className="text-center">
                        <p className="text-gray-400 text-sm">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors hover:underline"
                            >
                                Create one now
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-gray-500 text-sm">
                        Secure & Fast Authentication
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
