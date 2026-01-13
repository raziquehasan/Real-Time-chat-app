import React from 'react';

const OnlineUsersList = ({ users, currentUser, roomId }) => {
    return (
        <div className="w-72 bg-gray-900 border-l border-gray-700 p-4 overflow-y-auto">
            <div className="mb-4">
                <h3 className="text-white font-bold text-lg mb-1">Online Users</h3>
                <p className="text-gray-400 text-sm">{users.length} {users.length === 1 ? 'user' : 'users'} in room</p>
            </div>

            <div className="space-y-3">
                {users.map((user, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition"
                    >
                        <div className="relative">
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.userName)}&background=random&color=fff`}
                                alt={user.userName}
                                className="h-10 w-10 rounded-full"
                            />
                            {/* Online indicator */}
                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-gray-900" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                                {user.userName}
                                {user.userName === currentUser && (
                                    <span className="text-gray-400 text-xs ml-2">(You)</span>
                                )}
                            </p>
                            <p className="text-gray-500 text-xs">
                                {user.online ? 'Online' : 'Offline'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {users.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                    <p className="text-sm">No users online</p>
                </div>
            )}
        </div>
    );
};

export default OnlineUsersList;
