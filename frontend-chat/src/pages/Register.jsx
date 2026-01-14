import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import chatIcon from '../assets/chat.png';
import { FiMail, FiLock, FiUser, FiMessageCircle } from 'react-icons/fi';
import AnimatedInput from '../components/AnimatedInput';
import AnimatedButton from '../components/AnimatedButton';
import AvatarUpload from '../components/AvatarUpload';
import PasswordStrength from '../components/PasswordStrength';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
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

    const handleAvatarSelect = (file, preview) => {
        setAvatarFile(file);
        setAvatarPreview(preview);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name) {
            newErrors.name = 'Name is required';
        } else if (formData.name.length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

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

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
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
            // Register user first
            const response = await authAPI.register(
                formData.name,
                formData.email,
                formData.password
            );

            // Upload avatar if selected
            if (avatarFile) {
                try {
                    const formDataWithAvatar = new FormData();
                    formDataWithAvatar.append('file', avatarFile);

                    // Upload avatar (you'll need to create this endpoint)
                    // const avatarResponse = await api.post('/api/users/avatar', formDataWithAvatar, {
                    //   headers: {
                    //     'Content-Type': 'multipart/form-data',
                    //     'Authorization': `Bearer ${response.token}`
                    //   }
                    // });

                    // For now, we'll just use the preview as avatar
                    console.log('Avatar file ready for upload:', avatarFile);
                } catch (avatarError) {
                    console.error('Avatar upload failed:', avatarError);
                    // Don't fail registration if avatar upload fails
                }
            }

            // Auto-login after registration
            login(response.token, {
                id: response.userId,
                name: response.name,
                email: response.email,
                avatar: avatarPreview, // Use preview for now
            });

            toast.success('Account created successfully! 🎉', {
                icon: '✨',
                style: {
                    borderRadius: '10px',
                    background: '#1f2937',
                    color: '#fff',
                },
            });

            navigate('/');
        } catch (error) {
            console.error('Registration error:', error);
            const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
            toast.error(errorMessage, {
                style: {
                    borderRadius: '10px',
                    background: '#1f2937',
                    color: '#fff',
                },
            });

            // Shake animation on error
            setErrors({
                name: ' ',
                email: ' ',
                password: ' ',
                confirmPassword: ' '
            });
            setTimeout(() => setErrors({}), 500);
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = formData.name && formData.email && formData.password && formData.confirmPassword;

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 animate-gradient py-12 px-4">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
            </div>

            {/* Register Card */}
            <div
                className={`
          relative z-10 p-8 md:p-10 border border-gray-700/50 w-full max-w-md
          rounded-2xl bg-gray-900/80 backdrop-blur-xl shadow-2xl
          transition-all duration-700 transform
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          hover:shadow-green-500/20 hover:shadow-3xl
        `}
            >
                {/* Glow Effect on Hover */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Logo Section */}
                <div className="text-center mb-6">
                    <div className="inline-block animate-logoPulse">
                        <img
                            src={chatIcon}
                            className="w-16 h-16 mx-auto drop-shadow-2xl"
                            alt="Chat Icon"
                        />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-2 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Join Us Today
                    </h1>

                    <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
                        <FiMessageCircle className="text-green-400" />
                        Create your account and start chatting
                    </p>
                </div>

                {/* Avatar Upload */}
                <div className="mb-6">
                    <AvatarUpload
                        onImageSelect={handleAvatarSelect}
                        currentImage={avatarPreview}
                    />
                </div>

                {/* Register Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Input */}
                    <AnimatedInput
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Full Name"
                        icon={FiUser}
                        error={errors.name}
                        autoComplete="name"
                        required
                    />

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

                    {/* Password Input with Strength Indicator */}
                    <div>
                        <AnimatedInput
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Password"
                            icon={FiLock}
                            error={errors.password}
                            autoComplete="new-password"
                            required
                        />
                        <PasswordStrength password={formData.password} />
                    </div>

                    {/* Confirm Password Input */}
                    <AnimatedInput
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm Password"
                        icon={FiLock}
                        error={errors.confirmPassword}
                        autoComplete="new-password"
                        required
                    />

                    {/* Submit Button */}
                    <div className="pt-2">
                        <AnimatedButton
                            type="submit"
                            loading={loading}
                            disabled={!isFormValid || loading}
                            variant="success"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </AnimatedButton>
                    </div>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-gray-900 text-gray-400">OR</span>
                    </div>
                </div>

                {/* Login Link */}
                <div className="text-center">
                    <p className="text-gray-400 text-sm">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="text-green-400 hover:text-green-300 font-semibold transition-colors hover:underline"
                        >
                            Sign in instead
                        </Link>
                    </p>
                </div>

                {/* Footer Note */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        By creating an account, you agree to our{' '}
                        <button className="text-green-400 hover:text-green-300 hover:underline">
                            Terms
                        </button>
                        {' '}and{' '}
                        <button className="text-green-400 hover:text-green-300 hover:underline">
                            Privacy Policy
                        </button>
                    </p>
                </div>
            </div>

            {/* Keyboard Shortcut Hint */}
            <div className="absolute bottom-4 right-4 text-xs text-gray-600 hidden md:block">
                Press <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">Enter</kbd> to create account
            </div>
        </div>
    );
};

export default Register;
