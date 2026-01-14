import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import chatIcon from '../assets/chat.png';
import { FiMail, FiLock, FiMessageCircle } from 'react-icons/fi';
import AnimatedInput from '../components/AnimatedInput';
import AnimatedButton from '../components/AnimatedButton';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Entrance animation
    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        // Clear error when user starts typing
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.login(formData.email, formData.password);

            // Save token and user data
            login(response.token, {
                id: response.userId,
                name: response.name,
                email: response.email,
            });

            toast.success('Welcome back! 👋', {
                icon: '🎉',
                style: {
                    borderRadius: '10px',
                    background: '#1f2937',
                    color: '#fff',
                },
            });

            navigate('/');
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
            toast.error(errorMessage, {
                style: {
                    borderRadius: '10px',
                    background: '#1f2937',
                    color: '#fff',
                },
            });

            // Shake animation on error
            setErrors({
                email: ' ',
                password: ' '
            });
            setTimeout(() => setErrors({}), 500);
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = formData.email && formData.password;

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 animate-gradient">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
            </div>

            {/* Login Card */}
            <div
                className={`
          relative z-10 p-10 border border-gray-700/50 w-full max-w-md 
          rounded-2xl bg-gray-900/80 backdrop-blur-xl shadow-2xl
          transition-all duration-700 transform
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          hover:shadow-blue-500/20 hover:shadow-3xl
        `}
            >
                {/* Glow Effect on Hover */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Logo Section */}
                <div className="text-center mb-8">
                    <div className="inline-block animate-logoPulse">
                        <img
                            src={chatIcon}
                            className="w-20 h-20 mx-auto drop-shadow-2xl"
                            alt="Chat Icon"
                        />
                    </div>

                    <h1 className="text-4xl font-bold mt-6 mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Welcome Back
                    </h1>

                    <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
                        <FiMessageCircle className="text-blue-400" />
                        Sign in to continue your conversations
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Input */}
                    <AnimatedInput
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email Address"
                        icon={FiMail}
                        error={errors.email}
                        autoComplete="email"
                        required
                    />

                    {/* Password Input */}
                    <AnimatedInput
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
                        icon={FiLock}
                        error={errors.password}
                        autoComplete="current-password"
                        required
                    />

                    {/* Forgot Password Link */}
                    <div className="text-right">
                        <button
                            type="button"
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors hover:underline"
                        >
                            Forgot password?
                        </button>
                    </div>

                    {/* Submit Button */}
                    <AnimatedButton
                        type="submit"
                        loading={loading}
                        disabled={!isFormValid || loading}
                        variant="primary"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </AnimatedButton>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-gray-900 text-gray-400">OR</span>
                    </div>
                </div>

                {/* Register Link */}
                <div className="text-center">
                    <p className="text-gray-400 text-sm">
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            className="text-blue-400 hover:text-blue-300 font-semibold transition-colors hover:underline"
                        >
                            Create one now
                        </Link>
                    </p>
                </div>

                {/* Footer Note */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-500">
                        By signing in, you agree to our{' '}
                        <button className="text-blue-400 hover:text-blue-300 hover:underline">
                            Terms
                        </button>
                        {' '}and{' '}
                        <button className="text-blue-400 hover:text-blue-300 hover:underline">
                            Privacy Policy
                        </button>
                    </p>
                </div>
            </div>

            {/* Keyboard Shortcut Hint */}
            <div className="absolute bottom-4 right-4 text-xs text-gray-600 hidden md:block">
                Press <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">Enter</kbd> to sign in
            </div>
        </div>
    );
};

export default Login;
