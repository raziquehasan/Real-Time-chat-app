import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import UserList from '../components/UserList';
import PrivateChat from '../components/PrivateChat';
import GroupList from '../components/GroupList';
import GroupChat from '../components/GroupChat';
import { FiLogOut, FiMessageCircle, FiUsers, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authAPI, callAPI } from '../services/api';
import CallContainer from '../components/calls/CallContainer';

const ChatApp = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [activeTab, setActiveTab] = useState('private'); // 'private' or 'groups'
    const [stompClient, setStompClient] = useState(null);
    const [connected, setConnected] = useState(false);
    const clientRef = useRef(null);

    useEffect(() => {
        if (user) {
            connectWebSocket();
        }

        return () => {
            disconnectWebSocket();
        };
    }, [user]);

    const connectWebSocket = () => {
        try {
            const socket = new SockJS(import.meta.env.VITE_WS_URL || 'http://localhost:8080/chat');
            const client = new Client({
                webSocketFactory: () => socket,
                connectHeaders: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 25000,
                heartbeatOutgoing: 25000,
                debug: (str) => {
                    if (import.meta.env.DEV) console.log('STOMP: ' + str);
                },
                onConnect: () => {
                    console.log('✅ WebSocket Connected');
                    setConnected(true);
                    // Force refresh status on connect
                    client.publish({ destination: '/app/user/status', body: 'ONLINE' });
                    toast.success('Connected to chat server', {
                        icon: '🔌',
                        style: {
                            borderRadius: '10px',
                            background: '#1f2937',
                            color: '#fff',
                        },
                    });
                },
                onDisconnect: () => {
                    console.log('❌ WebSocket Disconnected');
                    setConnected(false);
                },
                onStompError: (frame) => {
                    console.error('STOMP error:', frame);
                    toast.error('Connection error. Retrying...', {
                        style: {
                            borderRadius: '10px',
                            background: '#1f2937',
                            color: '#fff',
                        },
                    });
                },
            });

            client.activate();
            clientRef.current = client;
            setStompClient(client);
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            toast.error('Failed to connect to chat server');
        }
    };

    const disconnectWebSocket = () => {
        if (clientRef.current) {
            clientRef.current.deactivate();
            setConnected(false);
        }
    };

    const handleLogout = async () => {
        try {
            await authAPI.logout();
            disconnectWebSocket();
            logout();
            navigate('/login');
            toast.success('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            // Logout anyway
            disconnectWebSocket();
            logout();
            navigate('/login');
        }
    };

    const handleSelectUser = (u) => {
        setSelectedGroup(null);
        setSelectedUser(u);
    };

    const handleSelectGroup = (g) => {
        setSelectedUser(null);
        setSelectedGroup(g);
    };

    const callContainerRef = useRef(null);

    // Function to initiate a call (to be passed to components)
    const handleInitiateCall = (targetId, type, isGroup = false, groupId = null) => {
        if (callContainerRef.current) {
            callContainerRef.current.initiateCall(targetId, type, isGroup, groupId);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-900">
            {/* Top Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                        <FiMessageCircle className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">ZapChat</h1>
                        <p className="text-xs text-gray-400">
                            {connected ? (
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Connected
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                    Disconnected
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* User Info & Logout */}
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-white font-semibold">{user?.name}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="Logout"
                    >
                        <FiLogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Fixed Sidebar for Tab Switching */}
                <div className="w-16 flex-shrink-0 bg-gray-950 flex flex-col items-center py-6 gap-6 border-r border-gray-800">
                    <button
                        onClick={() => setActiveTab('private')}
                        className={`p-3 rounded-xl transition-all ${activeTab === 'private'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                        title="Direct Messages"
                    >
                        <FiUser size={24} />
                    </button>
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`p-3 rounded-xl transition-all ${activeTab === 'groups'
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                        title="Group Chats"
                    >
                        <FiUsers size={24} />
                    </button>
                </div>

                {/* Sidebar List (Conditional) */}
                <div className="w-80 flex-shrink-0">
                    {activeTab === 'private' ? (
                        <UserList
                            onSelectUser={handleSelectUser}
                            selectedUserId={selectedUser?.id}
                            stompClient={stompClient}
                        />
                    ) : (
                        <GroupList
                            onSelectGroup={handleSelectGroup}
                            selectedGroupId={selectedGroup?.id}
                            stompClient={stompClient}
                            currentUser={user}
                        />
                    )}
                </div>

                {/* Chat Area (Conditional) */}
                <div className="flex-1 bg-[#0b141a]">
                    {selectedUser ? (
                        <PrivateChat
                            selectedUser={selectedUser}
                            stompClient={stompClient}
                            onInitiateCall={handleInitiateCall}
                        />
                    ) : selectedGroup ? (
                        <GroupChat
                            group={selectedGroup}
                            stompClient={stompClient}
                            currentUser={user}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-[#0b141a]">
                            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <FiMessageCircle size={48} className="opacity-20" />
                            </div>
                            <h2 className="text-xl font-medium text-gray-400">Select a chat to start messaging</h2>
                            <p className="text-sm mt-2 opacity-60">Your messages are end-to-end encrypted</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Call Management */}
            <CallContainer
                ref={callContainerRef}
                stompClient={stompClient}
                currentUser={user}
                connected={connected}
            />
        </div>
    );
};

export default ChatApp;
