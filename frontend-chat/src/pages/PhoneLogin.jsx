import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const PhoneLogin = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();

        // Validation
        if (!phoneNumber || phoneNumber.length < 10) {
            toast.error('Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.sendOTP({ phoneNumber });

            if (response.success) {
                toast.success('OTP sent successfully!');
                // Navigate to OTP verification screen
                navigate('/verify-otp', { state: { phoneNumber } });
            } else {
                toast.error(response.message || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            toast.error(error.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Only digits
        if (value.length <= 10) {
            setPhoneNumber(value);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-white mb-2">ZapChat</h1>
                    <p className="text-gray-300">Enter your phone number to get started</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                    <form onSubmit={handleSendOTP}>
                        {/* Phone Input */}
                        <div className="mb-6">
                            <label className="block text-white text-sm font-medium mb-2">
                                Phone Number
                            </label>
                            <div className="flex items-center bg-white/20 rounded-lg p-3 border border-white/30 focus-within:border-purple-400 transition">
                                <span className="text-white font-medium mr-2">+91</span>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={handlePhoneChange}
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
                            disabled={loading || phoneNumber.length !== 10}
                            className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 ${loading || phoneNumber.length !== 10
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                                }`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Sending OTP...
                                </div>
                            ) : (
                                'Send OTP'
                            )}
                        </button>
                    </form>

                    {/* Info */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-400 text-sm">
                            By continuing, you agree to our Terms & Privacy Policy
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

export default PhoneLogin;
