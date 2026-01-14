import React, { useState } from 'react';
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
    const [ripples, setRipples] = useState([]);

    const variants = {
        primary: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
        secondary: 'bg-gray-700 hover:bg-gray-600',
        success: 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700',
    };

    const handleClick = (e) => {
        if (disabled || loading) return;

        // Create ripple effect
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newRipple = {
            x,
            y,
            id: Date.now()
        };

        setRipples(prev => [...prev, newRipple]);

        // Remove ripple after animation
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 600);

        onClick?.(e);
    };

    return (
        <button
            type={type}
            onClick={handleClick}
            disabled={disabled || loading}
            className={`
        relative w-full px-6 py-3.5 rounded-lg font-semibold text-white
        transition-all duration-200 overflow-hidden
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900
        transform hover:scale-[1.02] active:scale-[0.98]
        ${loading ? 'animate-pulse' : ''}
        ${variants[variant]}
        ${className}
      `}
            style={{
                transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms'
            }}
        >
            {/* Ripple Effects */}
            {ripples.map(ripple => (
                <span
                    key={ripple.id}
                    className="absolute bg-white/30 rounded-full pointer-events-none animate-ripple"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: '20px',
                        height: '20px',
                        transform: 'translate(-50%, -50%) scale(0)',
                        animation: 'ripple 600ms ease-out'
                    }}
                />
            ))}

            {/* Button Content */}
            <span className="relative flex items-center justify-center gap-2">
                {loading && (
                    <FiLoader className="animate-spin" size={20} />
                )}
                {!loading && children}
                {loading && <span className="opacity-70">Processing...</span>}
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
