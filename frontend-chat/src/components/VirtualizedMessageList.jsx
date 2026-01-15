import React, { useCallback, useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import { FiTrash2, FiShare2 } from 'react-icons/fi';

const VirtualizedMessageList = ({
    messages,
    currentUserId,
    highlightedMessageId,
    searchQuery,
    searchOpen,
    onContextMenu,
    highlightText,
    formatTimestamp,
    containerRef,
    containerHeight
}) => {
    // Calculate row height based on message content
    const getItemSize = useCallback((index) => {
        const message = messages[index];
        if (!message) return 80;

        // Base height
        let height = 80;

        // Add height for file attachments
        if (message.fileUrl) {
            if (message.fileType?.startsWith('image')) {
                height += 320; // Image height
            } else if (message.fileType?.startsWith('audio')) {
                height += 60; // Audio player height
            } else {
                height += 80; // File card height
            }
        }

        // Add height for long messages (approximate)
        if (message.content && message.content.length > 100) {
            height += Math.floor(message.content.length / 50) * 20;
        }

        // Add height for reply preview
        if (message.replyTo) {
            height += 50;
        }

        // Add height for reactions
        if (message.reactions && Object.keys(message.reactions).length > 0) {
            height += 30;
        }

        return height;
    }, [messages]);

    // Memoized row renderer
    const Row = useCallback(({ index, style }) => {
        const message = messages[index];
        if (!message) return null;

        const isOwnMessage = message.senderId === currentUserId;

        // Check if message is deleted
        if (message.deletedForEveryone) {
            return (
                <div style={style} className="px-4">
                    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className="bg-[#2a3942] text-gray-400 italic rounded-lg px-4 py-2 text-sm flex items-center gap-2 opacity-60">
                            <FiTrash2 size={14} />
                            <span>This message was deleted</span>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div style={style} className="px-4">
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

                        {/* Message content */}
                        <p className="text-[15px] leading-relaxed break-words">
                            {searchOpen && searchQuery
                                ? highlightText(message.content, searchQuery)
                                : message.content
                            }
                        </p>

                        {/* Timestamp */}
                        <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[10px] opacity-60">
                                {formatTimestamp(message.timestamp)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }, [messages, currentUserId, highlightedMessageId, searchQuery, searchOpen, onContextMenu, highlightText, formatTimestamp]);

    return (
        <List
            height={containerHeight}
            itemCount={messages.length}
            itemSize={getItemSize}
            width="100%"
            overscanCount={5}
        >
            {Row}
        </List>
    );
};

export default React.memo(VirtualizedMessageList);
