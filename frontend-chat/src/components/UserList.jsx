import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { FiSearch, FiUser, FiCircle } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const UserList = ({ onSelectUser, selectedUserId, stompClient }) => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadUsers();
    }, [currentUser]);

    // Subscribe to real-time status updates
    useEffect(() => {
        if (!stompClient || !stompClient.connected) return;

        const subscription = stompClient.subscribe('/topic/user-status', (message) => {
            const statusUpdate = JSON.parse(message.body);
            setUsers((prevUsers) =>
                prevUsers.map((u) =>
                    u.id === statusUpdate.userId
                        ? { ...u, online: statusUpdate.online, lastSeen: statusUpdate.lastSeen }
                        : u
                )
            );
        });

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [stompClient, stompClient?.connected]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await usersAPI.getAllUsers();
            // Filter out current user from the list
            setUsers(data.filter(u => u.id !== currentUser?.id));
            setError(null);
        } catch (err) {
            console.error('Failed to load users:', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatLastSeen = (lastSeen) => {
        if (!lastSeen) return 'Never';
        try {
            return formatDistanceToNow(new Date(lastSeen), { addSuffix: true });
        } catch {
            return 'Recently';
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-900 border-r border-gray-700">
            {/* Header / Current User */}
            <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                <div
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-3 mb-4 p-2 rounded-xl hover:bg-gray-700 cursor-pointer transition-all border border-transparent hover:border-gray-600"
                >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {currentUser?.avatarUrl ? (
                            <img src={currentUser.avatarUrl} alt="Me" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <FiUser size={20} />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">{currentUser?.name}</h3>
                        <p className="text-[10px] text-blue-400">My Profile</p>
                    </div>
                </div>

                <h2 className="text-xl font-bold text-white mb-3">Messages</h2>

                {/* Search Bar */}
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="p-4 text-center text-red-400">{error}</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">
                        {searchQuery ? 'No users found' : 'No users available'}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800">
                        {filteredUsers.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => onSelectUser(user)}
                                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-800 transition-colors ${selectedUserId === user.id ? 'bg-gray-800' : ''
                                    }`}
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                        {user.avatarUrl ? (
                                            <img
                                                src={user.avatarUrl}
                                                alt={user.name}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <FiUser size={24} />
                                        )}
                                    </div>

                                    {/* Online Status Indicator */}
                                    {user.online && (
                                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-gray-900 rounded-full"></div>
                                    )}
                                </div>

                                {/* User Info */}
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-semibold text-white truncate">{user.name}</h3>
                                        {user.online && (
                                            <FiCircle className="text-green-500 flex-shrink-0" size={8} fill="currentColor" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400 truncate">
                                        {user.online ? 'Online' : `Last seen ${formatLastSeen(user.lastSeen)}`}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserList;
