import React from 'react';

const MessageStatusIcon = ({ message, currentUser }) => {
    // Only show status for messages sent by current user
    if (message.sender !== currentUser) {
        return null;
    }

    const status = message.status || 'SENT';

    if (status === 'SENT') {
        return (
            <span className="text-gray-400 text-xs ml-2" title="Sent">
                ✓
            </span>
        );
    } else if (status === 'DELIVERED') {
        return (
            <span className="text-gray-400 text-xs ml-2" title="Delivered">
                ✓✓
            </span>
        );
    } else if (status === 'SEEN') {
        return (
            <span className="text-blue-400 text-xs ml-2" title="Seen">
                ✓✓
            </span>
        );
    }

    return null;
};

export default MessageStatusIcon;
