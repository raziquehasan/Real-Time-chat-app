import React, { useState } from 'react';

const EmojiPicker = ({ onEmojiSelect, onClose }) => {
    const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

    return (
        <div className="absolute bottom-full mb-2 bg-gray-800 rounded-lg shadow-lg p-2 flex gap-2 border border-gray-700">
            {emojis.map((emoji) => (
                <button
                    key={emoji}
                    onClick={() => {
                        onEmojiSelect(emoji);
                        onClose();
                    }}
                    className="text-2xl hover:scale-125 transition-transform duration-200 hover:bg-gray-700 rounded p-1"
                    title={`React with ${emoji}`}
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
};

export default EmojiPicker;
