import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import UserList from '../components/UserList';
import PrivateChat from '../components/PrivateChat';
import { FiLogOut, FiMessageCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authAPI, callAPI } from '../services/api';
import CallContainer from '../components/calls/CallContainer';

const ChatApp = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState(null);
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
                heartbeatIncoming: 10000,
                heartbeatOutgoing: 10000,
                debug: (str) => {
                    console.log('STOMP: ' + str);
                },
                onConnect: () => {
                    console.log('✅ WebSocket Connected');
                    setConnected(true);
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
        setSelectedUser(u);
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
                {/* User List Sidebar */}
                <div className="w-80 flex-shrink-0">
                    <UserList
                        onSelectUser={handleSelectUser}
                        selectedUserId={selectedUser?.id}
                        stompClient={stompClient}
                    />
                </div>

                {/* Chat Area */}
                <div className="flex-1">
                    <PrivateChat
                        selectedUser={selectedUser}
                        stompClient={stompClient}
                        onInitiateCall={handleInitiateCall}
                    />
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
