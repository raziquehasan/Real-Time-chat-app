import React from 'react';

const UserListSkeleton = () => {
    return (
        <div className="divide-y divide-gray-800">
            {[...Array(6)].map((_, index) => (
                <div key={index} className="p-4 flex items-center gap-3 animate-pulse">
                    {/* Avatar skeleton */}
                    <div className="w-12 h-12 rounded-full bg-gray-700/50"></div>

                    {/* User info skeleton */}
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-700/50 rounded w-32"></div>
                        <div className="h-3 bg-gray-700/30 rounded w-24"></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default UserListSkeleton;
