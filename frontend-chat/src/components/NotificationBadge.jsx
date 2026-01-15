import React, { useState, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { notificationAPI } from '../services/api';

const NotificationBadge = ({ onClick, stompClient, currentUser }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        loadUnreadCount();
    }, []);

    // Subscribe to real-time notification events
    useEffect(() => {
        if (!stompClient || !stompClient.connected || !currentUser) return;

        const subscription = stompClient.subscribe('/user/queue/notifications', (message) => {
            const event = JSON.parse(message.body);
            if (event.type === 'notification:new') {
                setUnreadCount(prev => prev + 1);
                setPulse(true);
                setTimeout(() => setPulse(false), 1000);
            }
        });

        const eventSubscription = stompClient.subscribe('/user/queue/notification-events', (message) => {
            const event = JSON.parse(message.body);
            if (event.type === 'notification:read') {
                setUnreadCount(prev => Math.max(0, prev - 1));
            } else if (event.type === 'notification:mark-all-read') {
                setUnreadCount(0);
            } else if (event.type === 'notification:clear-all') {
                setUnreadCount(0);
            }
        });

        return () => {
            if (subscription) subscription.unsubscribe();
            if (eventSubscription) eventSubscription.unsubscribe();
        };
    }, [stompClient, currentUser]);

    const loadUnreadCount = async () => {
        try {
            const response = await notificationAPI.getUnreadCount();
            setUnreadCount(response.count);
        } catch (error) {
            console.error('Failed to load unread count:', error);
        }
    };

    return (
        <button
            onClick={onClick}
            className="relative p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
            title="Notifications"
        >
            <FiBell size={20} className={pulse ? 'animate-bounce' : ''} />
            {unreadCount > 0 && (
                <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 ${pulse ? 'animate-pulse' : ''
                    }`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </button>
    );
};

export default NotificationBadge;
