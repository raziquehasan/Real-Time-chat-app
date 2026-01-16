import React, { useState, useCallback } from 'react';
import { FiTrash2, FiShare2, FiFile, FiDownload, FiMic, FiCornerUpLeft, FiCheck } from 'react-icons/fi';
import { format } from 'date-fns';

const MessageItem = React.memo(({
    message,
    isOwnMessage,
    currentUserId,
    highlightedMessageId,
    searchQuery,
    searchOpen,
    onContextMenu,
    highlightText,
    handleReaction
}) => {
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

    const formatTimestamp = useCallback((timestamp) => {
        return format(new Date(timestamp), 'HH:mm');
    }, []);

    // Check if message is deleted
    if (message.deletedForEveryone) {
        return (
            <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className="bg-[#2a3942] text-gray-400 italic rounded-lg px-4 py-2 text-sm flex items-center gap-2 opacity-60">
                    <FiTrash2 size={14} />
                    <span>This message was deleted</span>
                </div>
            </div>
        );
    }

    return (
        <div
            id={`msg-${message.id}`}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            onContextMenu={(e) => onContextMenu(e, message)}
        >
            <div className={`relative max-w-[85%] sm:max-w-[70%] rounded-lg shadow-md transition-all hover:scale-[1.02] ${highlightedMessageId === message.id ? 'ring-2 ring-yellow-400' : ''
                } ${isOwnMessage ? 'bg-[#005c4b] text-white' : 'bg-[#202c33] text-white'} ${message.fileUrl && message.fileType?.startsWith('image') ? 'p-1' : 'px-3 py-2'
                }`}>
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
                                <audio src={message.fileUrl} controls className="w-full" />
                            </div>
                        ) : (
                            <a
                                href={message.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 hover:bg-black/20 transition-colors"
                            >
                                <FiFile size={24} className="text-blue-400" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{message.fileName || 'File'}</p>
                                    <p className="text-xs opacity-60">Click to download</p>
                                </div>
                                <FiDownload size={18} className="opacity-60" />
                            </a>
                        )}
                    </div>
                )}

                {/* Reply Preview */}
                {message.replyTo && (
                    <div
                        className="bg-gray-700/50 border-l-4 border-blue-500 pl-2 py-1 mb-2 rounded cursor-pointer hover:bg-gray-700/70 transition-colors"
                        onClick={() => {
                            const targetMsg = document.getElementById(`msg-${message.replyTo.messageId}`);
                            if (targetMsg) {
                                targetMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                // Highlight animation
                                targetMsg.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-50');
                                setTimeout(() => {
                                    targetMsg.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-50');
                                }, 2000);
                            }
                        }}
                    >
                        <p className="font-bold text-blue-400 text-xs">{message.replyTo.senderName}</p>
                        <p className="truncate">{message.replyTo.content}</p>
                    </div>
                )}

                {/* Message Content */}
                <p className="text-[15px] leading-relaxed break-words">
                    {searchOpen && searchQuery
                        ? highlightText(message.content, searchQuery)
                        : message.content
                    }
                </p>

                {/* Reactions Display */}
                {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/10">
                        {Object.entries(message.reactions).map(([userId, emoji]) => (
                            <span
                                key={userId}
                                className="text-sm bg-black/20 px-2 py-0.5 rounded-full"
                                title={userId === currentUserId ? 'You' : 'User'}
                            >
                                {emoji}
                            </span>
                        ))}
                    </div>
                )}

                {/* Timestamp and Status */}
                <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] opacity-60">
                        {formatTimestamp(message.timestamp)}
                    </span>
                    {isOwnMessage && (
                        <span className="text-[10px]">
                            {message.isRead || message.read ? (
                                <span className="text-blue-400"><FiCheck size={14} /></span>
                            ) : message.isDelivered ? (
                                <FiCheck size={14} />
                            ) : null}
                        </span>
                    )}
                </div>

                {/* Reaction Picker */}
                {showReactionPicker && (
                    <div className="absolute -top-10 left-0 bg-[#202c33] border border-gray-700 rounded-lg shadow-xl p-2 flex gap-1 z-10">
                        {quickReactions.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => {
                                    handleReaction(message.id, emoji);
                                    setShowReactionPicker(false);
                                }}
                                className="hover:scale-125 transition-transform p-1 text-lg"
                                title={emoji}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for optimization
    return (
        prevProps.message.id === nextProps.message.id &&
        prevProps.message.content === nextProps.message.content &&
        prevProps.message.isRead === nextProps.message.isRead &&
        prevProps.message.deletedForEveryone === nextProps.message.deletedForEveryone &&
        prevProps.highlightedMessageId === nextProps.highlightedMessageId &&
        prevProps.searchQuery === nextProps.searchQuery &&
        JSON.stringify(prevProps.message.reactions) === JSON.stringify(nextProps.message.reactions)
    );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;
