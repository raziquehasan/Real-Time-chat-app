import React from 'react';

const ChatSkeleton = () => {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0b141a]">
            {/* Skeleton messages */}
            {[...Array(8)].map((_, index) => {
                const isOwn = index % 3 === 0;
                return (
                    <div
                        key={index}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-pulse`}
                    >
                        <div
                            className={`max-w-[70%] rounded-lg p-3 ${isOwn ? 'bg-[#005c4b]/20' : 'bg-[#202c33]/50'
                                }`}
                        >
                            {/* Message content skeleton */}
                            <div className="space-y-2">
                                <div
                                    className={`h-3 bg-gray-600/30 rounded ${index % 2 === 0 ? 'w-48' : 'w-32'
                                        }`}
                                ></div>
                                {index % 3 === 0 && (
                                    <div className="h-3 bg-gray-600/30 rounded w-40"></div>
                                )}
                            </div>
                            {/* Timestamp skeleton */}
                            <div className="h-2 bg-gray-600/20 rounded w-12 mt-2"></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ChatSkeleton;
