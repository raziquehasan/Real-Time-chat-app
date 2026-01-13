import React, { useState } from 'react';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const AnimatedInput = ({
    type = 'text',
    name,
    value,
    onChange,
    placeholder,
    icon: Icon,
    error,
    required = false
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [capsLockOn, setCapsLockOn] = useState(false);

    const handleKeyDown = (e) => {
        if (type === 'password') {
            setCapsLockOn(e.getModifierState('CapsLock'));
        }
    };

    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
        <div className="relative">
            {/* Floating Label */}
            <label
                htmlFor={name}
                className={`absolute left-12 transition-all duration-200 pointer-events-none ${isFocused || value
                        ? '-top-2 text-xs bg-gray-900 px-2 text-blue-400'
                        : 'top-3.5 text-gray-400'
                    }`}
            >
                {placeholder} {required && '*'}
            </label>

            {/* Input Container */}
            <div className="relative">
                {/* Icon */}
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Icon size={20} />
                    </div>
                )}

                {/* Input Field */}
                <input
                    type={inputType}
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    className={`w-full bg-gray-800 pl-12 pr-12 py-3.5 border rounded-lg 
            transition-all duration-200 text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${error
                            ? 'border-red-500 animate-shake'
                            : isFocused
                                ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                                : 'border-gray-600 hover:border-gray-500'
                        }`}
                    required={required}
                />

                {/* Password Toggle */}
                {type === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        tabIndex={-1}
                    >
                        {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                )}

                {/* Caps Lock Warning */}
                {type === 'password' && capsLockOn && isFocused && (
                    <div className="absolute right-14 top-1/2 -translate-y-1/2">
                        <div className="bg-yellow-500 text-black text-xs px-2 py-1 rounded shadow-lg">
                            Caps Lock is ON
                        </div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <p className="mt-1 text-sm text-red-400 animate-fadeIn">
                    {error}
                </p>
            )}

            {/* Focus Glow Effect */}
            {isFocused && !error && (
                <div className="absolute inset-0 -z-10 bg-blue-500/10 blur-xl rounded-lg animate-pulse" />
            )}
        </div>
    );
};

export default AnimatedInput;
