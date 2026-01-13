import React from 'react';

const MessageReactions = ({ reactions, currentUser, onReactionClick }) => {
    if (!reactions || reactions.length === 0) {
        return null;
    }

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = {
                emoji: reaction.emoji,
                count: 0,
                users: [],
                hasCurrentUser: false
            };
        }
        acc[reaction.emoji].count++;
        acc[reaction.emoji].users.push(reaction.userName);
        if (reaction.userId === currentUser || reaction.userName === currentUser) {
            acc[reaction.emoji].hasCurrentUser = true;
        }
        return acc;
    }, {});

    return (
        <div className="flex flex-wrap gap-1 mt-2">
            {Object.values(groupedReactions).map((group) => (
                <button
                    key={group.emoji}
                    onClick={() => onReactionClick(group.emoji)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all ${group.hasCurrentUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    title={group.users.join(', ')}
                >
                    <span>{group.emoji}</span>
                    <span className="text-xs">{group.count}</span>
                </button>
            ))}
        </div>
    );
};

export default MessageReactions;
