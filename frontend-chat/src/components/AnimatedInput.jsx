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
    success = false,
    required = false,
    autoComplete
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [capsLockOn, setCapsLockOn] = useState(false);
    const [hasShaken, setHasShaken] = useState(false);

    // Determine if label should float (when focused or has value)
    const shouldFloat = isFocused || value;

    const handleKeyDown = (e) => {
        if (type === 'password') {
            setCapsLockOn(e.getModifierState('CapsLock'));
        }
    };

    // Trigger shake animation when error appears
    React.useEffect(() => {
        if (error) {
            setHasShaken(true);
            const timer = setTimeout(() => setHasShaken(false), 500);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
        <div className="relative">
            {/* Input Container */}
            <div className="relative">
                {/* Icon */}
                {Icon && (
                    <div
                        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isFocused
                                ? error
                                    ? 'text-red-400'
                                    : success
                                        ? 'text-green-400'
                                        : 'text-blue-400'
                                : 'text-gray-400'
                            }`}
                    >
                        <Icon size={20} />
                    </div>
                )}

                {/* Floating Label */}
                <label
                    htmlFor={name}
                    className={`
                        absolute left-12 pointer-events-none
                        transition-all duration-300 ease-out
                        ${shouldFloat
                            ? '-top-2.5 text-xs px-2 bg-gray-900 z-10 ' + (
                                error
                                    ? 'text-red-400'
                                    : success
                                        ? 'text-green-400'
                                        : isFocused
                                            ? 'text-blue-400'
                                            : 'text-gray-400'
                            )
                            : 'top-3.5 text-base text-gray-400'
                        }
                    `}
                    style={{
                        transition: 'all 300ms ease-out'
                    }}
                >
                    {placeholder} {required && shouldFloat && <span className="text-red-400">*</span>}
                </label>

                {/* Input Field - NO PLACEHOLDER ATTRIBUTE */}
                <input
                    type={inputType}
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    autoComplete={autoComplete}
                    className={`
                        w-full bg-gray-800 pl-12 pr-12 py-3.5 border-2 rounded-lg 
                        transition-all duration-300 ease-out text-white
                        focus:outline-none
                        ${error
                            ? 'border-red-500 focus:ring-2 focus:ring-red-500/50'
                            : success
                                ? 'border-green-500 focus:ring-2 focus:ring-green-500/50'
                                : isFocused
                                    ? 'border-blue-500 shadow-lg shadow-blue-500/30 focus:ring-2 focus:ring-blue-500/50'
                                    : 'border-gray-600 hover:border-gray-500'
                        }
                        ${hasShaken ? 'animate-shake' : ''}
                    `}
                    style={{
                        transition: 'all 300ms ease-out'
                    }}
                    required={required}
                />

                {/* Password Toggle */}
                {type === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                )}

                {/* Caps Lock Warning */}
                {type === 'password' && capsLockOn && isFocused && (
                    <div className="absolute right-14 top-1/2 -translate-y-1/2 animate-fadeIn">
                        <div className="bg-yellow-500 text-black text-xs px-2 py-1 rounded shadow-lg font-medium">
                            Caps Lock is ON
                        </div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <p className="mt-1.5 text-sm text-red-400 animate-fadeIn flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-400 rounded-full"></span>
                    {error}
                </p>
            )}

            {/* Focus Glow Effect */}
            {!error && (
                <div
                    className={`absolute inset-0 -z-10 rounded-lg blur-xl transition-opacity duration-300 ${isFocused || success ? 'opacity-100' : 'opacity-0'
                        }`}
                    style={{
                        background: success
                            ? 'rgba(34, 197, 94, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)'
                    }}
                />
            )}
        </div>
    );
};

export default AnimatedInput;
