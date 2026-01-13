import React from 'react';

const TypingIndicator = ({ userName }) => {
    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-lg">
            <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-sm text-gray-400">{userName} is typing...</span>
        </div>
    );
};

export default TypingIndicator;
