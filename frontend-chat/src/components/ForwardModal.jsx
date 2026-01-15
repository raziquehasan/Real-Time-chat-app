import React, { useState, useEffect } from 'react';
import { FiX, FiSearch, FiCheck, FiSend } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';

const ForwardModal = ({ message, onClose, onForward }) => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await usersAPI.getAllUsers();
            // Filter out current user
            setUsers(data.filter(u => u.id !== currentUser?.id));
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUser = (userId) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const handleForward = () => {
        if (selectedUsers.size > 0) {
            onForward(Array.from(selectedUsers));
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#202c33] rounded-2xl w-full max-w-md mx-4 shadow-2xl border border-gray-700 animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Forward Message</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Message Preview */}
                <div className="p-4 bg-[#0b141a] border-b border-gray-700">
                    <div className="bg-[#005c4b] text-white rounded-lg p-3 text-sm">
                        {message.fileUrl && message.fileType?.startsWith('image') && (
                            <img src={message.fileUrl} alt="preview" className="max-h-20 rounded mb-2" />
                        )}
                        <p className="line-clamp-2">{message.content}</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-gray-700">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#2a3942] text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* User List */}
                <div className="max-h-80 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-gray-400">No contacts found</div>
                    ) : (
                        <div className="divide-y divide-gray-800">
                            {filteredUsers.map((user) => {
                                const isSelected = selectedUsers.has(user.id);
                                return (
                                    <button
                                        key={user.id}
                                        onClick={() => toggleUser(user.id)}
                                        className={`w-full p-4 flex items-center gap-3 hover:bg-gray-800 transition-all ${isSelected ? 'bg-gray-800/50' : ''
                                            }`}
                                    >
                                        {/* Checkbox */}
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected
                                            ? 'bg-blue-500 border-blue-500 scale-110'
                                            : 'border-gray-600'
                                            }`}>
                                            {isSelected && <FiCheck size={14} className="text-white" />}
                                        </div>

                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                user.name.charAt(0).toUpperCase()
                                            )}
                                        </div>

                                        {/* User Info */}
                                        <div className="flex-1 text-left min-w-0">
                                            <h3 className="font-semibold text-white truncate">{user.name}</h3>
                                            <p className="text-sm text-gray-400 truncate">{user.email}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700 flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                        {selectedUsers.size > 0 ? `${selectedUsers.size} selected` : 'Select contacts'}
                    </span>
                    <button
                        onClick={handleForward}
                        disabled={selectedUsers.size === 0}
                        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-all flex items-center gap-2 disabled:cursor-not-allowed active:scale-95"
                    >
                        <FiSend size={16} />
                        Forward {selectedUsers.size > 0 && `to ${selectedUsers.size}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForwardModal;
