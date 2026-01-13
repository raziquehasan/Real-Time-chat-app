import React from 'react';

const TypingIndicator = ({ typingUsers }) => {
    if (typingUsers.length === 0) return null;

    const getTypingText = () => {
        if (typingUsers.length === 1) {
            return `${typingUsers[0]} is typing`;
        } else if (typingUsers.length === 2) {
            return `${typingUsers[0]} and ${typingUsers[1]} are typing`;
        } else {
            return `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`;
        }
    };

    return (
        <div className="px-4 py-2 bg-gray-800/50">
            <div className="flex items-center gap-2">
                <div className="flex gap-1">
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <p className="text-sm text-gray-400 italic">
                    {getTypingText()}...
                </p>
            </div>
        </div>
    );
};

export default TypingIndicator;
