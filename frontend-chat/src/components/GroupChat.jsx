import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiPaperclip, FiMoreVertical, FiInfo, FiUsers, FiUserPlus, FiTrash2, FiLogOut } from 'react-icons/fi';
import { groupAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import AddMemberModal from './AddMemberModal';

const GroupChat = ({ group, stompClient, currentUser, onShowInfo, onShowMembers }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [replyTo, setReplyTo] = useState(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [groupMembers, setGroupMembers] = useState([]);
    const messagesEndRef = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        if (group) {
            loadMessages();
            loadMembers();
            subscribeToGroup();
        }
    }, [group]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadMembers = async () => {
        try {
            const members = await groupAPI.getMembers(group.id);
            setGroupMembers(members);
        } catch (error) {
            console.error('Failed to load members:', error);
        }
    };

    const loadMessages = async () => {
        try {
            setLoading(true);
            const response = await groupAPI.getMessages(group.id, page, 50);
            setMessages(response.content.reverse());
            setHasMore(!response.last);
        } catch (error) {
            console.error('Failed to load messages:', error);
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const subscribeToGroup = () => {
        if (!stompClient || !stompClient.connected) return;

        // Subscribe to group messages
        const messageSubscription = stompClient.subscribe(
            `/topic/group/${group.id}`,
            (message) => {
                const newMsg = JSON.parse(message.body);
                setMessages(prev => [...prev, newMsg]);
            }
        );

        // Subscribe to group events
        const eventSubscription = stompClient.subscribe(
            `/topic/group/${group.id}/events`,
            (event) => {
                const data = JSON.parse(event.body);
                handleGroupEvent(data);
            }
        );

        return () => {
            if (messageSubscription) messageSubscription.unsubscribe();
            if (eventSubscription) eventSubscription.unsubscribe();
        };
    };

    const handleGroupEvent = (event) => {
        switch (event.type) {
            case 'MEMBER_JOINED':
                toast.success(`${event.member.userName} joined the group`);
                break;
            case 'MEMBER_LEFT':
                toast(`Member left the group`);
                break;
            case 'ROLE_UPDATED':
                toast(`Role updated for a member`);
                break;
            default:
                break;
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            setSending(true);
            const messageData = {
                content: newMessage,
                mentionedUserIds: extractMentions(newMessage),
                replyToMessageId: replyTo?.id
            };

            await groupAPI.sendMessage(group.id, messageData);
            setNewMessage('');
            setReplyTo(null);
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const extractMentions = (text) => {
        const mentionRegex = /@(\w+)/g;
        const mentions = [];
        let match;
        while ((match = mentionRegex.exec(text)) !== null) {
            mentions.push(match[1]);
        }
        return mentions;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleClearChat = async () => {
        if (!window.confirm('Are you sure you want to clear all messages in this group?')) return;
        try {
            await groupAPI.clearChat(group.id);
            setMessages([]);
            toast.success('Chat cleared');
            setShowMenu(false);
        } catch (error) {
            console.error('Failed to clear chat:', error);
            toast.error('Failed to clear chat');
        }
    };

    const handleExitGroup = async () => {
        if (!window.confirm('Are you sure you want to exit this group?')) return;
        try {
            await groupAPI.exitGroup(group.id);
            toast.success('Exited group');
            window.location.reload(); // Simple way to refresh UI state
        } catch (error) {
            console.error('Failed to exit group:', error);
            toast.error('Failed to exit group');
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#0b141a]">
            {/* Header */}
            <div className="bg-[#202c33] p-4 flex items-center justify-between border-b border-gray-700 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {group.avatarUrl ? (
                            <img src={group.avatarUrl} alt={group.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            group.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div>
                        <h2 className="text-white font-medium">{group.name}</h2>
                        <p className="text-gray-400 text-sm">{group.memberCount} members</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onShowMembers}
                        className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
                        title="Members"
                    >
                        <FiUsers size={20} />
                    </button>
                    <button
                        onClick={onShowInfo}
                        className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
                        title="Group Info"
                    >
                        <FiInfo size={20} />
                    </button>

                    {/* Three-dot Menu */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={`p-2 hover:bg-gray-700 rounded-full transition-colors ${showMenu ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <FiMoreVertical size={20} />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-[#233138] rounded-lg shadow-2xl border border-gray-700 overflow-hidden z-50 py-1 anim-fade-in-down">
                                <button
                                    onClick={() => {
                                        setShowAddMember(true);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-3 flex items-center gap-3 text-gray-200 hover:bg-[#182229] transition-colors text-sm"
                                >
                                    <FiUserPlus className="text-blue-400" />
                                    Add Member
                                </button>
                                <button
                                    onClick={handleClearChat}
                                    className="w-full px-4 py-3 flex items-center gap-3 text-gray-200 hover:bg-[#182229] transition-colors text-sm"
                                >
                                    <FiTrash2 className="text-orange-400" />
                                    Clear Chat
                                </button>
                                <div className="border-t border-gray-700 my-1"></div>
                                <button
                                    onClick={handleExitGroup}
                                    className="w-full px-4 py-3 flex items-center gap-3 text-red-400 hover:bg-[#182229] transition-colors text-sm"
                                >
                                    <FiLogOut />
                                    Exit Group
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Member Modal */}
            {showAddMember && (
                <AddMemberModal
                    groupId={group.id}
                    existingMembers={groupMembers}
                    onClose={() => setShowAddMember(false)}
                    onMemberAdded={(user) => {
                        setGroupMembers(prev => [...prev, { userId: user.id, userName: user.name }]);
                        // Optionally reload group details to update count
                    }}
                />
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <FiUsers size={64} className="mb-4 opacity-20" />
                        <p className="text-lg">No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-lg p-3 ${message.senderId === currentUser?.id
                                    ? 'bg-[#005c4b] text-white'
                                    : 'bg-[#202c33] text-white'
                                    }`}
                            >
                                {message.senderId !== currentUser?.id && (
                                    <p className="text-[#00a884] text-sm font-medium mb-1">
                                        {message.senderName}
                                    </p>
                                )}
                                {message.replyTo && (
                                    <div className="bg-black/20 p-2 rounded mb-2 text-sm border-l-4 border-[#00a884]">
                                        <p className="text-[#00a884] font-medium">{message.replyTo.senderName}</p>
                                        <p className="text-gray-300 truncate">{message.replyTo.content}</p>
                                    </div>
                                )}
                                <p className="break-words">{message.content}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyTo && (
                <div className="bg-[#1a252d] p-3 border-t border-gray-700 flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-[#00a884] text-sm font-medium">Replying to {replyTo.senderName}</p>
                        <p className="text-gray-400 text-sm truncate">{replyTo.content}</p>
                    </div>
                    <button
                        onClick={() => setReplyTo(null)}
                        className="text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Input */}
            <div className="bg-[#202c33] p-4 border-t border-gray-700">
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white">
                        <FiPaperclip size={20} />
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1 bg-[#2a3942] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={sending || !newMessage.trim()}
                        className="p-2 bg-[#00a884] hover:bg-[#06cf9c] text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiSend size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupChat;
