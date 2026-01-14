import React, { useState, useEffect, useRef } from 'react';
import { privateChatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiSend, FiPaperclip, FiMoreVertical, FiUser, FiCircle, FiFile, FiDownload, FiCheck } from 'react-icons/fi';
import { format, isToday, isYesterday, isSameDay, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const PrivateChat = ({ selectedUser, stompClient }) => {
    const { user: currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);

    const messagesEndRef = useRef(null);
    const messageContainerRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (selectedUser) {
            loadMessages();
            markMessagesAsRead();
        }
    }, [selectedUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!stompClient || !stompClient.connected || !currentUser) return;

        const messageSubscription = stompClient.subscribe(
            `/user/${currentUser.id}/queue/messages`,
            (message) => {
                const receivedMessage = JSON.parse(message.body);
                if (
                    receivedMessage.senderId === selectedUser?.id ||
                    receivedMessage.receiverId === selectedUser?.id
                ) {
                    setMessages((prev) => {
                        const exists = prev.some((msg) => msg.id === receivedMessage.id);
                        if (exists) return prev;
                        return [...prev, receivedMessage];
                    });

                    if (receivedMessage.senderId === selectedUser?.id) {
                        markMessagesAsRead();
                    }
                }
            }
        );

        const typingSubscription = stompClient.subscribe(
            `/user/${currentUser.id}/queue/typing`,
            (message) => {
                const typingNotification = JSON.parse(message.body);
                if (typingNotification.userId === selectedUser?.id) {
                    setOtherUserTyping(typingNotification.typing);
                    if (typingNotification.typing) {
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                        typingTimeoutRef.current = setTimeout(() => setOtherUserTyping(false), 3000);
                    }
                }
            }
        );

        return () => {
            if (messageSubscription) {
                messageSubscription.unsubscribe();
            }
            if (typingSubscription) {
                typingSubscription.unsubscribe();
            }
        };
    }, [stompClient, stompClient?.connected, currentUser, selectedUser]);

    const loadMessages = async () => {
        if (!selectedUser) return;
        try {
            setLoading(true);
            const data = await privateChatAPI.getMessages(selectedUser.id);
            setMessages(data);
        } catch (error) {
            console.error('Failed to load messages:', error);
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const markMessagesAsRead = async () => {
        if (!selectedUser) return;
        try {
            await privateChatAPI.markAsRead(selectedUser.id);
        } catch (error) {
            console.error('Failed to mark messages as read:', error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !stompClient || !stompClient.connected || typeof stompClient.send !== 'function' || !selectedUser) return;

        try {
            setSending(true);
            const messagePayload = {
                senderId: currentUser.id,
                senderName: currentUser.name,
                receiverId: selectedUser.id,
                receiverName: selectedUser.name,
                content: newMessage.trim(),
            };
            stompClient.send('/app/private', {}, JSON.stringify(messagePayload));
            setNewMessage('');
            handleStopTyping();
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // Check file size (10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
            toast.error('File size exceeds 10MB limit');
            return;
        }

        try {
            setUploading(true);
            setUploadProgress(10); // Start progress

            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('receiverId', selectedUser.id);

            setUploadProgress(30);
            await privateChatAPI.sendFile(formData);

            setUploadProgress(100);
            toast.success('File sent successfully');
        } catch (error) {
            console.error('File upload failed:', error);
            toast.error('Failed to send file');
        } finally {
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 500);
            e.target.value = null;
        }
    };

    const handleTyping = () => {
        if (!stompClient || !stompClient.connected || typeof stompClient.send !== 'function' || !selectedUser) return;
        const now = Date.now();
        if (!isTyping || (now - (handleTyping.lastSent || 0) > 2000)) {
            setIsTyping(true);
            handleTyping.lastSent = now;
            const typingNotification = {
                userId: currentUser.id,
                userName: currentUser.name,
                receiverId: selectedUser.id,
                typing: true,
            };
            stompClient.send('/app/typing', {}, JSON.stringify(typingNotification));
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => handleStopTyping(), 3000);
    };

    const handleStopTyping = () => {
        if (!stompClient || !stompClient.connected || typeof stompClient.send !== 'function' || !selectedUser || !isTyping) return;
        setIsTyping(false);
        const typingNotification = {
            userId: currentUser.id,
            userName: currentUser.name,
            receiverId: selectedUser.id,
            typing: false,
        };
        stompClient.send('/app/typing', {}, JSON.stringify(typingNotification));
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatMessageDate = (timestamp) => {
        const date = new Date(timestamp);
        if (isToday(date)) return format(date, 'HH:mm');
        if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
        return format(date, 'MMM dd, HH:mm');
    };

    const shouldShowDateSeparator = (currentMsg, previousMsg) => {
        if (!previousMsg) return true;
        return !isSameDay(new Date(currentMsg.timestamp), new Date(previousMsg.timestamp));
    };

    const formatDateSeparator = (timestamp) => {
        const date = new Date(timestamp);
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMMM dd, yyyy');
    };

    if (!selectedUser) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-900 text-gray-400">
                <div className="text-center">
                    <FiUser size={64} className="mx-auto mb-4 text-gray-600" />
                    <p className="text-lg">Select a user to start chatting</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-900 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {selectedUser.avatar ? (
                                <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <FiUser size={20} />
                            )}
                        </div>
                        {selectedUser.online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">{selectedUser.name}</h3>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                            {otherUserTyping ? (
                                <span className="text-blue-400">typing...</span>
                            ) : selectedUser.online ? (
                                <>
                                    <FiCircle size={6} fill="currentColor" className="text-green-500" />
                                    Online
                                </>
                            ) : (
                                `Last seen ${selectedUser.lastSeen ? formatDistanceToNow(new Date(selectedUser.lastSeen), { addSuffix: true }) : 'Recently'}`
                            )}
                        </p>
                    </div>
                </div>
                <button className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400">
                    <FiMoreVertical size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div
                ref={messageContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0b141a]"
                style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundOpacity: 0.1 }}
            >
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const isOwnMessage = message.senderId === currentUser.id;
                        const showDateSeparator = shouldShowDateSeparator(message, messages[index - 1]);

                        return (
                            <React.Fragment key={message.id}>
                                {showDateSeparator && (
                                    <div className="flex justify-center my-4">
                                        <span className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full">{formatDateSeparator(message.timestamp)}</span>
                                    </div>
                                )}
                                <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`relative max-w-[85%] sm:max-w-[70%] rounded-lg shadow-md ${isOwnMessage ? 'bg-[#005c4b] text-white' : 'bg-[#202c33] text-white'
                                        } ${message.fileUrl && message.fileType?.startsWith('image') ? 'p-1' : 'px-3 py-2'}`}>

                                        {/* File Attachment Rendering */}
                                        {message.fileUrl && (
                                            <div className="mb-1 rounded-md overflow-hidden bg-black/10">
                                                {message.fileType?.startsWith('image') ? (
                                                    <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                                                        <img
                                                            src={message.fileUrl}
                                                            alt="shared"
                                                            className="max-h-80 w-full object-cover hover:opacity-90 transition-opacity"
                                                        />
                                                    </a>
                                                ) : (
                                                    <div className="flex items-center gap-3 p-3 bg-black/20 min-w-[200px]">
                                                        <div className="p-2 bg-gray-700 rounded-lg">
                                                            <FiFile size={24} className="text-blue-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{message.fileName || 'Document'}</p>
                                                            <p className="text-[10px] opacity-60 uppercase">{message.fileType?.split('/')[1] || 'FILE'}</p>
                                                        </div>
                                                        <a
                                                            href={message.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80"
                                                        >
                                                            <FiDownload size={18} />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Message Content */}
                                        <div className={`${message.fileUrl && message.fileType?.startsWith('image') ? 'px-2 pb-1' : ''}`}>
                                            <p className="text-[15px] leading-relaxed break-words">{message.content}</p>
                                            <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isOwnMessage ? 'text-blue-100/70' : 'text-gray-400'}`}>
                                                <span>{formatMessageDate(message.timestamp)}</span>
                                                {isOwnMessage && (
                                                    <div className="flex">
                                                        <FiCheck size={12} className={message.isRead ? 'text-blue-400' : ''} />
                                                        {message.isRead && <FiCheck size={12} className="text-blue-400 -ml-2" />}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
                {uploading && (
                    <div className="flex justify-end">
                        <div className="bg-[#005c4b] text-white rounded-lg px-4 py-2 text-sm shadow-md animate-pulse flex flex-col items-center gap-2">
                            <span>Sending file...</span>
                            <div className="w-32 h-1 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-400 transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-2 bg-[#202c33] border-t border-gray-700">
                <form onSubmit={sendMessage} className="flex items-center gap-2 max-w-6xl mx-auto">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="p-3 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                        title="Add attachment"
                    >
                        <FiPaperclip size={24} />
                    </button>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                            onBlur={handleStopTyping}
                            placeholder="Type a message"
                            className="w-full bg-[#2a3942] text-white px-4 py-3 rounded-xl focus:outline-none placeholder-gray-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending || uploading}
                        className="p-3 bg-[#00a884] text-white rounded-full disabled:opacity-50 hover:bg-[#06cf9c] transition-all shadow-lg active:scale-95"
                    >
                        <FiSend size={24} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PrivateChat;
