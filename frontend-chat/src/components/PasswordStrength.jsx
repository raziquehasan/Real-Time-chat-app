import React from 'react';

const PasswordStrength = ({ password }) => {
    // Calculate password strength
    const calculateStrength = () => {
        let strength = 0;
        if (!password) return 0;

        // Length check
        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;

        // Character variety checks
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;

        return Math.min(strength, 4);
    };

    const strength = calculateStrength();

    const getStrengthConfig = () => {
        if (strength === 0) return { text: '', color: 'bg-gray-600', textColor: 'text-gray-400' };
        if (strength <= 2) return { text: 'Weak', color: 'bg-red-500', textColor: 'text-red-400' };
        if (strength === 3) return { text: 'Good', color: 'bg-yellow-500', textColor: 'text-yellow-400' };
        return { text: 'Strong', color: 'bg-green-500', textColor: 'text-green-400' };
    };

    const config = getStrengthConfig();

    if (!password) return null;

    return (
        <div className="mt-3 space-y-2 animate-fadeIn">
            {/* Strength Bars */}
            <div className="flex gap-1.5">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < strength ? config.color : 'bg-gray-700'
                            }`}
                    />
                ))}
            </div>

            {/* Strength Text */}
            {strength > 0 && (
                <div className="flex items-center justify-between">
                    <p className={`text-xs font-medium ${config.textColor}`}>
                        Password strength: {config.text}
                    </p>

                    {/* Tips for weak passwords */}
                    {strength <= 2 && (
                        <p className="text-xs text-gray-500">
                            Add {strength === 1 ? 'numbers & symbols' : 'more characters'}
                        </p>
                    )}
                </div>
            )}

            {/* Strength Requirements */}
            {strength < 4 && (
                <div className="text-xs text-gray-500 space-y-1 mt-2">
                    <p className="font-medium text-gray-400">Password should have:</p>
                    <ul className="space-y-0.5 ml-4">
                        <li className={password.length >= 6 ? 'text-green-400' : 'text-gray-500'}>
                            ✓ At least 6 characters
                        </li>
                        <li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-green-400' : 'text-gray-500'}>
                            ✓ Upper & lowercase letters
                        </li>
                        <li className={/\d/.test(password) ? 'text-green-400' : 'text-gray-500'}>
                            ✓ At least one number
                        </li>
                        <li className={/[^a-zA-Z\d]/.test(password) ? 'text-green-400' : 'text-gray-500'}>
                            ✓ Special character (!@#$%)
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PasswordStrength;
