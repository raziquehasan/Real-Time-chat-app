import React from 'react';
import { FiLoader } from 'react-icons/fi';

const AnimatedButton = ({
    children,
    loading = false,
    disabled = false,
    type = 'button',
    variant = 'primary',
    onClick,
    className = ''
}) => {
    const variants = {
        primary: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
        secondary: 'bg-gray-700 hover:bg-gray-600',
        success: 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`
        relative w-full px-6 py-3.5 rounded-lg font-semibold text-white
        transition-all duration-200 overflow-hidden
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        transform hover:scale-[1.02] active:scale-[0.98]
        ${variants[variant]}
        ${className}
      `}
        >
            {/* Ripple Effect Background */}
            <span className="absolute inset-0 bg-white/20 transform scale-0 group-hover:scale-100 transition-transform duration-500 rounded-full" />

            {/* Button Content */}
            <span className="relative flex items-center justify-center gap-2">
                {loading && (
                    <FiLoader className="animate-spin" size={20} />
                )}
                {children}
            </span>

            {/* Shimmer Effect */}
            {!disabled && !loading && (
                <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            )}

            {/* Glow Effect on Hover */}
            <span className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-xl -z-10" />
        </button>
    );
};

export default AnimatedButton;
