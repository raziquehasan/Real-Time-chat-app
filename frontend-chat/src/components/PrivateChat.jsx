import React, { useState, useEffect, useRef } from 'react';
import { privateChatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiSend, FiPaperclip, FiMoreVertical, FiUser, FiCircle, FiFile, FiDownload, FiCheck, FiMic, FiSquare, FiCornerUpLeft, FiX, FiSearch, FiShare2, FiTrash2 } from 'react-icons/fi';
import { format, isToday, isYesterday, isSameDay, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import ForwardModal from './ForwardModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import MessageSearch from './MessageSearch';

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
    const [hoveredMessageId, setHoveredMessageId] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    // New states for premium features
    const [contextMenu, setContextMenu] = useState(null);
    const [forwardModalOpen, setForwardModalOpen] = useState(false);
    const [messageToForward, setMessageToForward] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);
    const [pendingDeletes, setPendingDeletes] = useState(new Map());

    const messagesEndRef = useRef(null);
    const messageContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordingIntervalRef = useRef(null);
    const audioChunksRef = useRef([]);
    const typingTimeoutRef = useRef(null);


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
            `/user/queue/messages`,
            (message) => {
                const receivedMessage = JSON.parse(message.body);
                console.log('📨 Received message:', receivedMessage);

                // Show message if it's between current user and selected user
                const isRelevantMessage = selectedUser && (
                    (receivedMessage.senderId === currentUser.id && receivedMessage.receiverId === selectedUser.id) ||
                    (receivedMessage.senderId === selectedUser.id && receivedMessage.receiverId === currentUser.id)
                );

                if (isRelevantMessage) {
                    console.log('✅ Adding message to chat');
                    setMessages((prev) => {
                        const exists = prev.some((msg) => msg.id === receivedMessage.id);
                        if (exists) return prev;
                        return [...prev, receivedMessage];
                    });

                    if (receivedMessage.senderId === selectedUser?.id) {
                        markMessagesAsRead();
                    }
                } else {
                    console.log('⏭️ Message not relevant for current chat');
                }
            }
        );

        const typingSubscription = stompClient.subscribe(
            `/user/queue/typing`,
            (message) => {
                const typingNotification = JSON.parse(message.body);
                // The backend sends back 'senderId' that corresponds to the person who is typing
                if (typingNotification.senderId === selectedUser?.id) {
                    setOtherUserTyping(typingNotification.typing);
                    if (typingNotification.typing) {
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                        typingTimeoutRef.current = setTimeout(() => setOtherUserTyping(false), 5000);
                    }
                }
            }
        );

        const readReceiptSubscription = stompClient.subscribe(
            `/user/queue/read-receipt`,
            (message) => {
                const messageIds = JSON.parse(message.body);
                console.log('✅ Received read receipt for messages:', messageIds);
                setMessages((prev) =>
                    prev.map((msg) =>
                        messageIds.includes(msg.id) ? { ...msg, isRead: true, read: true } : msg
                    )
                );
            }
        );

        const reactionSubscription = stompClient.subscribe(
            `/user/queue/reactions`,
            (message) => {
                const reactionNotification = JSON.parse(message.body);
                console.log('✅ Received reaction update:', reactionNotification);
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === reactionNotification.messageId
                            ? { ...msg, reactions: reactionNotification.reactions }
                            : msg
                    )
                );
            }
        );

        // Subscribe to delete message events
        const deleteSubscription = stompClient.subscribe(
            `/user/queue/delete-message`,
            (message) => {
                const deleteNotification = JSON.parse(message.body);
                console.log('🗑️ Received delete notification:', deleteNotification);

                if (deleteNotification.deleteType === 'FOR_EVERYONE') {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === deleteNotification.messageId
                                ? { ...msg, deletedForEveryone: true, deletedAt: new Date() }
                                : msg
                        )
                    );
                }
            }
        );

        return () => {
            if (messageSubscription) messageSubscription.unsubscribe();
            if (typingSubscription) typingSubscription.unsubscribe();
            if (readReceiptSubscription) readReceiptSubscription.unsubscribe();
            if (reactionSubscription) reactionSubscription.unsubscribe();
            if (deleteSubscription) deleteSubscription.unsubscribe();
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
        if (!newMessage.trim() || !stompClient || !stompClient.connected || !selectedUser) return;

        try {
            setSending(true);
            const messagePayload = {
                senderId: currentUser.id,
                senderName: currentUser.name,
                receiverId: selectedUser.id,
                receiverName: selectedUser.name,
                content: newMessage.trim(),
                replyTo: replyingTo ? {
                    messageId: replyingTo.id,
                    content: replyingTo.content,
                    senderName: replyingTo.senderName
                } : null
            };

            console.log('🔍 Attempting to send message:', messagePayload);
            console.log('🔍 stompClient:', stompClient);
            console.log('🔍 stompClient.send exists?', !!stompClient.send);
            console.log('🔍 stompClient.publish exists?', !!stompClient.publish);

            // Try using publish method instead of send
            if (stompClient && stompClient.publish) {
                console.log('✅ Using stompClient.publish');
                stompClient.publish({
                    destination: '/app/private',
                    body: JSON.stringify(messagePayload)
                });
            } else if (stompClient && stompClient.send) {
                console.log('✅ Using stompClient.send');
                stompClient.send('/app/private', {}, JSON.stringify(messagePayload));
            } else {
                console.error('❌ No send or publish method available!');
            }

            setNewMessage('');
            setReplyingTo(null);
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

            console.log('📂 Uploading file to receiver:', selectedUser.id);
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('receiverId', selectedUser.id);
            formData.append('content', selectedFile.name);

            console.log('📂 FormData:', {
                fileName: selectedFile.name,
                receiverId: selectedUser.id,
                content: selectedFile.name
            });

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
        if (!stompClient || !stompClient.connected || !selectedUser) return;
        const now = Date.now();
        // Send typing status every 3 seconds while typing
        if (!isTyping || (now - (handleTyping.lastSent || 0) > 3000)) {
            setIsTyping(true);
            handleTyping.lastSent = now;
            const typingNotification = {
                senderId: currentUser.id,
                receiverId: selectedUser.id,
                typing: true,
            };
            if (stompClient && stompClient.publish) {
                stompClient.publish({
                    destination: '/app/typing',
                    body: JSON.stringify(typingNotification)
                });
            }
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => handleStopTyping(), 5000);
    };

    const handleStopTyping = () => {
        if (!stompClient || !stompClient.connected || !selectedUser || !isTyping) return;
        setIsTyping(false);
        const typingNotification = {
            senderId: currentUser.id,
            receiverId: selectedUser.id,
            typing: false,
        };
        if (stompClient && stompClient.publish) {
            stompClient.publish({
                destination: '/app/typing',
                body: JSON.stringify(typingNotification)
            });
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                if (audioBlob.size > 0) {
                    const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
                    await sendAudioFile(audioFile);
                }
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 60) {
                        stopRecording();
                        return 60;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (error) {
            console.error('Recording failed:', error);
            toast.error('Could not access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(recordingIntervalRef.current);
        }
    };

    const sendAudioFile = async (file) => {
        try {
            setUploading(true);
            setUploadProgress(10);
            console.log('🎤 Uploading voice note to receiver:', selectedUser.id);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('receiverId', selectedUser.id);
            formData.append('content', 'Voice Note');

            console.log('🎤 FormData:', {
                fileName: file.name,
                receiverId: selectedUser.id,
                content: 'Voice Note'
            });

            await privateChatAPI.sendFile(formData);
            setUploadProgress(100);
            toast.success('Voice note sent');
        } catch (error) {
            toast.error('Failed to send voice note');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleReaction = async (messageId, emoji) => {
        try {
            await privateChatAPI.reactToMessage({ messageId, emoji });
            // Optimistic update
            setMessages(prev => prev.map(msg => {
                if (msg.id === messageId) {
                    const newReactions = { ...(msg.reactions || {}) };
                    if (newReactions[currentUser.id] === emoji) {
                        delete newReactions[currentUser.id];
                    } else {
                        newReactions[currentUser.id] = emoji;
                    }
                    return { ...msg, reactions: newReactions };
                }
                return msg;
            }));
        } catch (error) {
            console.error('Failed to react:', error);
            toast.error('Failed to add reaction');
        }
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

    // Context menu handlers
    const handleContextMenu = (e, message) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            message
        });
    };

    const handleLongPress = (message) => {
        setContextMenu({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            message
        });
    };

    // Close context menu on outside click
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        if (contextMenu) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu]);

    // Forward message handler
    const handleForward = async (receiverIds) => {
        try {
            await privateChatAPI.forwardMessage(messageToForward.id, receiverIds);
            toast.success(`Message forwarded to ${receiverIds.length} contact${receiverIds.length > 1 ? 's' : ''}`);
            setForwardModalOpen(false);
            setMessageToForward(null);
        } catch (error) {
            console.error('Failed to forward message:', error);
            toast.error('Failed to forward message');
        }
    };

    // Delete message handler
    const handleDeleteConfirm = async (deleteType) => {
        try {
            await privateChatAPI.deleteMessage(messageToDelete.id, deleteType);

            // Show undo toast
            const toastId = toast((t) => (
                <div className="flex items-center gap-3">
                    <span>Message deleted</span>
                    <button
                        onClick={() => {
                            // Remove from pending deletes
                            setPendingDeletes(prev => {
                                const newMap = new Map(prev);
                                newMap.delete(messageToDelete.id);
                                return newMap;
                            });
                            toast.dismiss(t.id);
                            toast.success('Delete cancelled');
                        }}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded text-white text-sm font-medium"
                    >
                        Undo
                    </button>
                </div>
            ), {
                duration: 5000,
                icon: '🗑️'
            });

            // Add to pending deletes
            setPendingDeletes(prev => new Map(prev).set(messageToDelete.id, { deleteType, toastId }));

            // After 5 seconds, apply the delete
            setTimeout(() => {
                setPendingDeletes(prev => {
                    const newMap = new Map(prev);
                    if (newMap.has(messageToDelete.id)) {
                        newMap.delete(messageToDelete.id);

                        // Apply delete to messages
                        if (deleteType === 'FOR_ME') {
                            setMessages(prevMessages =>
                                prevMessages.filter(msg => msg.id !== messageToDelete.id)
                            );
                        } else if (deleteType === 'FOR_EVERYONE') {
                            setMessages(prevMessages =>
                                prevMessages.map(msg =>
                                    msg.id === messageToDelete.id
                                        ? { ...msg, deletedForEveryone: true, deletedAt: new Date() }
                                        : msg
                                )
                            );
                        }
                    }
                    return newMap;
                });
            }, 5000);

            setDeleteDialogOpen(false);
            setMessageToDelete(null);
        } catch (error) {
            console.error('Failed to delete message:', error);
            toast.error('Failed to delete message');
        }
    };

    // Search handlers
    const handleJumpToMessage = (message) => {
        setHighlightedMessageId(message.id);
        const element = document.getElementById(`msg-${message.id}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Flash highlight
            setTimeout(() => setHighlightedMessageId(null), 2000);
        }
    };

    // Keyboard shortcut for search (Ctrl+F)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === 'Escape') {
                setSearchOpen(false);
                setContextMenu(null);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Highlight search matches
    const highlightText = (text, query) => {
        if (!query || !searchOpen) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <mark key={i} className="bg-yellow-400 text-black rounded px-0.5">{part}</mark>
            ) : (
                part
            )
        );
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
                            {selectedUser.avatarUrl ? (
                                <img src={selectedUser.avatarUrl} alt={selectedUser.name} className="w-full h-full rounded-full object-cover" />
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
                        <div className="text-xs text-gray-400 h-4 flex items-center">
                            {otherUserTyping ? (
                                <div className="flex items-center gap-1.5 text-blue-400 font-medium">
                                    <span>typing</span>
                                    <div className="flex gap-0.5 mt-1">
                                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
                                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
                                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
                                    </div>
                                </div>
                            ) : selectedUser.online ? (
                                <>
                                    <FiCircle size={6} fill="currentColor" className="text-green-500" />
                                    Online
                                </>
                            ) : (
                                selectedUser.lastSeen
                                    ? `Last seen ${format(new Date(selectedUser.lastSeen), 'MMM dd, h:mm a')}`
                                    : 'Last seen recently'
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSearchOpen(!searchOpen)}
                        className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
                        title="Search messages (Ctrl+F)"
                    >
                        <FiSearch size={20} />
                    </button>
                    <button className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400">
                        <FiMoreVertical size={20} />
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            {searchOpen && (
                <MessageSearch
                    messages={messages}
                    onClose={() => setSearchOpen(false)}
                    onJumpToMessage={handleJumpToMessage}
                />
            )}

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

                        // Check if message is deleted
                        if (message.deletedForEveryone) {
                            return (
                                <React.Fragment key={message.id}>
                                    {showDateSeparator && (
                                        <div className="flex justify-center my-4">
                                            <span className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full">{formatDateSeparator(message.timestamp)}</span>
                                        </div>
                                    )}
                                    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                        <div className="bg-[#2a3942] text-gray-400 italic rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                                            <FiTrash2 size={14} />
                                            <span>This message was deleted</span>
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        }

                        return (
                            <React.Fragment key={message.id}>
                                {showDateSeparator && (
                                    <div className="flex justify-center my-4">
                                        <span className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full">{formatDateSeparator(message.timestamp)}</span>
                                    </div>
                                )}
                                <div
                                    id={`msg-${message.id}`}
                                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                    onContextMenu={(e) => handleContextMenu(e, message)}
                                >
                                    <div className={`relative max-w-[85%] sm:max-w-[70%] rounded-lg shadow-md transition-all ${highlightedMessageId === message.id ? 'ring-2 ring-yellow-400' : ''
                                        } ${isOwnMessage ? 'bg-[#005c4b] text-white' : 'bg-[#202c33] text-white'
                                        } ${message.fileUrl && message.fileType?.startsWith('image') ? 'p-1' : 'px-3 py-2'}`}>

                                        {/* Forwarded Indicator */}
                                        {message.forwardedFromId && (
                                            <div className="flex items-center gap-1 text-xs text-gray-400 mb-1 italic">
                                                <FiShare2 size={12} />
                                                <span>Forwarded</span>
                                            </div>
                                        )}

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
                                                ) : message.fileType?.startsWith('audio') ? (
                                                    <div className="p-2 min-w-[250px] bg-black/10 rounded-md">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <FiMic size={16} className="text-blue-400" />
                                                            <span className="text-[10px] font-medium opacity-60 uppercase">Voice Note</span>
                                                        </div>
                                                        <audio
                                                            src={message.fileUrl}
                                                            controls
                                                            className="w-full h-8 brightness-90 contrast-125"
                                                        />
                                                    </div>
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
                                        <div
                                            className={`group relative ${message.fileUrl && message.fileType?.startsWith('image') ? 'px-2 pb-1' : ''}`}
                                            onMouseEnter={() => setHoveredMessageId(message.id)}
                                            onMouseLeave={() => setHoveredMessageId(message.id === hoveredMessageId ? null : hoveredMessageId)}
                                        >
                                            {/* Reaction Picker and Reply on Hover */}
                                            {hoveredMessageId === message.id && (
                                                <div className={`absolute -top-10 ${isOwnMessage ? 'right-0' : 'left-0'} z-20 bg-[#202c33] border border-gray-700 rounded-full p-1 shadow-xl flex items-center gap-1 animate-in fade-in zoom-in duration-200`}>
                                                    <div className="flex px-1 border-r border-gray-700 mr-1">
                                                        <button
                                                            onClick={() => { setReplyingTo(message); setHoveredMessageId(null); }}
                                                            className="p-1 hover:bg-gray-700 rounded-full text-blue-400 transition-colors"
                                                            title="Reply"
                                                        >
                                                            <FiCornerUpLeft size={18} />
                                                        </button>
                                                    </div>
                                                    {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => { handleReaction(message.id, emoji); setHoveredMessageId(null); }}
                                                            className="hover:scale-125 transition-transform p-1 text-lg"
                                                            title={emoji}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Reply Preview in Message */}
                                            {message.replyTo && (
                                                <div className="mb-1 p-2 rounded bg-black/20 border-l-4 border-blue-500 text-[13px] opacity-80 cursor-pointer"
                                                    onClick={() => {
                                                        const targetMsg = document.getElementById(`msg-${message.replyTo.messageId}`);
                                                        if (targetMsg) targetMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    }}
                                                >
                                                    <p className="font-bold text-blue-400 text-xs">{message.replyTo.senderName}</p>
                                                    <p className="truncate">{message.replyTo.content}</p>
                                                </div>
                                            )}

                                            <p className="text-[15px] leading-relaxed break-words">
                                                {searchOpen && searchQuery
                                                    ? highlightText(message.content, searchQuery)
                                                    : message.content
                                                }
                                            </p>

                                            {/* Reactions Display */}
                                            {message.reactions && Object.keys(message.reactions).length > 0 && (
                                                <div className={`flex flex-wrap gap-0.5 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                                    {Object.entries(message.reactions).reduce((acc, [uid, emoji]) => {
                                                        const existing = acc.find(r => r.emoji === emoji);
                                                        if (existing) existing.count++;
                                                        else acc.push({ emoji, count: 1 });
                                                        return acc;
                                                    }, []).map(reaction => (
                                                        <span
                                                            key={reaction.emoji}
                                                            className="inline-flex items-center bg-gray-700/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-[12px] border border-gray-600/50"
                                                        >
                                                            {reaction.emoji} {reaction.count > 1 && reaction.count}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isOwnMessage ? 'text-blue-100/70' : 'text-gray-400'}`}>
                                                <span>{formatMessageDate(message.timestamp)}</span>
                                                {isOwnMessage && (
                                                    <div className="flex">
                                                        <FiCheck size={12} className={(message.isRead || message.read) ? 'text-blue-400' : ''} />
                                                        {(message.isRead || message.read) && <FiCheck size={12} className="text-blue-400 -ml-2" />}
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
                {/* Reply Preview Bar */}
                {replyingTo && (
                    <div className="max-w-6xl mx-auto mb-2 p-2 bg-[#2a3942] rounded-lg border-l-4 border-blue-500 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-blue-400">Replying to {replyingTo.senderName}</p>
                            <p className="text-sm text-gray-400 truncate">{replyingTo.content}</p>
                        </div>
                        <button
                            onClick={() => setReplyingTo(null)}
                            className="p-1 hover:bg-white/10 rounded-full text-gray-400"
                        >
                            <FiX size={18} />
                        </button>
                    </div>
                )}
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
                        {isRecording ? (
                            <div className="flex-1 bg-[#2a3942] text-white px-4 py-3 rounded-xl flex items-center justify-between animate-pulse">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                                    <span className="text-sm font-medium">Recording {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}</span>
                                </div>
                                <span className="text-xs text-gray-400">Max 60s</span>
                            </div>
                        ) : (
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                                onBlur={handleStopTyping}
                                placeholder="Type a message"
                                className="w-full bg-[#2a3942] text-white px-4 py-3 rounded-xl focus:outline-none placeholder-gray-500"
                            />
                        )}
                    </div>
                    {newMessage.trim() || isRecording ? (
                        <button
                            type={isRecording ? "button" : "submit"}
                            onClick={isRecording ? stopRecording : undefined}
                            disabled={(sending || uploading) && !isRecording}
                            className={`p-3 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-[#00a884] hover:bg-[#06cf9c]'} text-white rounded-full transition-all shadow-lg active:scale-95`}
                        >
                            {isRecording ? <FiSquare size={24} /> : <FiSend size={24} />}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={startRecording}
                            disabled={uploading}
                            className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-all"
                            title="Record voice note"
                        >
                            <FiMic size={24} />
                        </button>
                    )}
                </form>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-50 bg-[#202c33] border border-gray-700 rounded-lg shadow-2xl py-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-150"
                    style={{
                        left: `${contextMenu.x}px`,
                        top: `${contextMenu.y}px`,
                    }}
                >
                    <button
                        onClick={() => {
                            setReplyingTo(contextMenu.message);
                            setContextMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                    >
                        <FiCornerUpLeft size={16} className="text-blue-400" />
                        <span>Reply</span>
                    </button>
                    <button
                        onClick={() => {
                            setMessageToForward(contextMenu.message);
                            setForwardModalOpen(true);
                            setContextMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                    >
                        <FiShare2 size={16} className="text-green-400" />
                        <span>Forward</span>
                    </button>
                    <button
                        onClick={() => {
                            setMessageToDelete(contextMenu.message);
                            setDeleteDialogOpen(true);
                            setContextMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                    >
                        <FiTrash2 size={16} className="text-red-400" />
                        <span>Delete</span>
                    </button>
                </div>
            )}

            {/* Forward Modal */}
            {forwardModalOpen && messageToForward && (
                <ForwardModal
                    message={messageToForward}
                    onClose={() => {
                        setForwardModalOpen(false);
                        setMessageToForward(null);
                    }}
                    onForward={handleForward}
                />
            )}

            {/* Delete Confirm Dialog */}
            {deleteDialogOpen && messageToDelete && (
                <DeleteConfirmDialog
                    message={messageToDelete}
                    isSender={messageToDelete.senderId === currentUser.id}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => {
                        setDeleteDialogOpen(false);
                        setMessageToDelete(null);
                    }}
                />
            )}
        </div>
    );
};

export default PrivateChat;
