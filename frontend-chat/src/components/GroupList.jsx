import React, { useState, useEffect } from 'react';
import { FiUsers, FiPlus, FiSearch } from 'react-icons/fi';
import { groupAPI } from '../services/api';
import toast from 'react-hot-toast';

const GroupList = ({ onSelectGroup, selectedGroupId, stompClient, currentUser }) => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            setLoading(true);
            const data = await groupAPI.getMyGroups();
            setGroups(data);
        } catch (error) {
            console.error('Failed to load groups:', error);
            toast.error('Failed to load groups');
        } finally {
            setLoading(false);
        }
    };

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-[#111b21]">
            {/* Header */}
            <div className="bg-[#202c33] p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-white text-lg font-semibold flex items-center gap-2">
                        <FiUsers size={20} />
                        Groups
                    </h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="p-2 bg-[#00a884] hover:bg-[#06cf9c] text-white rounded-full transition-colors"
                        title="Create Group"
                    >
                        <FiPlus size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#2a3942] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Groups List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                        <FiUsers size={64} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium">No groups yet</p>
                        <p className="text-sm text-center mt-2">Create a group to get started</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800">
                        {filteredGroups.map((group) => (
                            <div
                                key={group.id}
                                onClick={() => onSelectGroup(group)}
                                className={`p-4 hover:bg-[#1a252d] cursor-pointer transition-colors ${selectedGroupId === group.id ? 'bg-[#1a252d]' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                        {group.avatarUrl ? (
                                            <img src={group.avatarUrl} alt={group.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            group.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-medium truncate">{group.name}</h3>
                                        <p className="text-gray-400 text-sm truncate">
                                            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Group Modal */}
            {showCreateModal && (
                <CreateGroupModal
                    onClose={() => setShowCreateModal(false)}
                    onGroupCreated={(newGroup) => {
                        setGroups([newGroup, ...groups]);
                        setShowCreateModal(false);
                        toast.success('Group created successfully!');
                    }}
                />
            )}
        </div>
    );
};

// Placeholder for CreateGroupModal
const CreateGroupModal = ({ onClose, onGroupCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error('Group name is required');
            return;
        }

        try {
            setCreating(true);
            const group = await groupAPI.createGroup({ name, description });
            onGroupCreated(group);
        } catch (error) {
            console.error('Failed to create group:', error);
            toast.error('Failed to create group');
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-[#202c33] rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 border-b border-gray-700">
                        <h2 className="text-white text-lg font-semibold">Create New Group</h2>
                    </div>
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="text-gray-400 text-sm mb-1 block">Group Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter group name"
                                className="w-full bg-[#111b21] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-sm mb-1 block">Description (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter group description"
                                rows={3}
                                className="w-full bg-[#111b21] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-700 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={creating}
                            className="flex-1 px-4 py-2 bg-[#00a884] hover:bg-[#06cf9c] text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            {creating ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default GroupList;
