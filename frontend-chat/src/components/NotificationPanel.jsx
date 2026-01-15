import React, { useState, useEffect } from 'react';
import { FiBell, FiX, FiCheck, FiTrash2 } from 'react-icons/fi';
import { notificationAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const NotificationPanel = ({ isOpen, onClose, stompClient, currentUser }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadNotifications();
        }
    }, [isOpen]);

    // Subscribe to real-time notifications
    useEffect(() => {
        if (!stompClient || !stompClient.connected || !currentUser) return;

        const subscription = stompClient.subscribe('/user/queue/notifications', (message) => {
            const event = JSON.parse(message.body);
            if (event.type === 'notification:new') {
                setNotifications(prev => [event.notification, ...prev]);
                // Play sound if enabled
                playNotificationSound();
            }
        });

        const eventSubscription = stompClient.subscribe('/user/queue/notification-events', (message) => {
            const event = JSON.parse(message.body);
            if (event.type === 'notification:mark-all-read') {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            } else if (event.type === 'notification:clear-all') {
                setNotifications([]);
            }
        });

        return () => {
            if (subscription) subscription.unsubscribe();
            if (eventSubscription) eventSubscription.unsubscribe();
        };
    }, [stompClient, currentUser]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationAPI.getNotifications(page, 20);
            setNotifications(response.content);
            setHasMore(!response.last);
        } catch (error) {
            console.error('Failed to load notifications:', error);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationAPI.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success('All notifications marked as read');
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            toast.error('Failed to mark all as read');
        }
    };

    const handleClearAll = async () => {
        try {
            await notificationAPI.clearAll();
            setNotifications([]);
            toast.success('All notifications cleared');
        } catch (error) {
            console.error('Failed to clear notifications:', error);
            toast.error('Failed to clear notifications');
        }
    };

    const playNotificationSound = () => {
        // Optional: Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => { });
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'MESSAGE': return '💬';
            case 'MENTION': return '@';
            case 'FILE': return '📎';
            case 'GROUP_INVITE': return '👥';
            default: return '🔔';
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-[#111b21] z-50 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                {/* Header */}
                <div className="bg-[#202c33] p-4 flex items-center justify-between border-b border-gray-700">
                    <h2 className="text-white text-lg font-semibold flex items-center gap-2">
                        <FiBell size={20} />
                        Notifications
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Actions */}
                {notifications.length > 0 && (
                    <div className="bg-[#1a252d] p-3 flex gap-2 border-b border-gray-700">
                        <button
                            onClick={handleMarkAllAsRead}
                            className="flex-1 px-3 py-2 bg-[#00a884] hover:bg-[#06cf9c] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <FiCheck size={16} />
                            Mark All Read
                        </button>
                        <button
                            onClick={handleClearAll}
                            className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <FiTrash2 size={16} />
                            Clear All
                        </button>
                    </div>
                )}

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                            <FiBell size={64} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium">No notifications</p>
                            <p className="text-sm text-center mt-2">You're all caught up!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-800">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-[#1a252d] transition-colors cursor-pointer ${!notification.isRead ? 'bg-[#1a252d]/50' : ''
                                        }`}
                                    onClick={() => {
                                        if (!notification.isRead) {
                                            handleMarkAsRead(notification.id);
                                        }
                                        // Navigate to actionUrl if needed
                                        if (notification.actionUrl) {
                                            // window.location.href = notification.actionUrl;
                                        }
                                    }}
                                >
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 text-2xl">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-white font-medium text-sm">
                                                    {notification.title}
                                                </p>
                                                {!notification.isRead && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                                                )}
                                            </div>
                                            <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                                                {notification.body}
                                            </p>
                                            <p className="text-gray-500 text-xs mt-2">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationPanel;
