import React, { useState, useEffect } from 'react';
import { FiSearch, FiX, FiChevronUp, FiChevronDown } from 'react-icons/fi';

const MessageSearch = ({ messages, onClose, onJumpToMessage }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [matchingIndices, setMatchingIndices] = useState([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

    useEffect(() => {
        if (searchQuery.trim()) {
            // Find all messages that match the search query
            const matches = messages
                .map((msg, index) => ({ msg, index }))
                .filter(({ msg }) =>
                    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
                );
            setMatchingIndices(matches.map(m => m.index));
            setCurrentMatchIndex(0);
        } else {
            setMatchingIndices([]);
            setCurrentMatchIndex(0);
        }
    }, [searchQuery, messages]);

    const goToNext = () => {
        if (matchingIndices.length > 0) {
            const nextIndex = (currentMatchIndex + 1) % matchingIndices.length;
            setCurrentMatchIndex(nextIndex);
            onJumpToMessage(messages[matchingIndices[nextIndex]]);
        }
    };

    const goToPrevious = () => {
        if (matchingIndices.length > 0) {
            const prevIndex = currentMatchIndex === 0 ? matchingIndices.length - 1 : currentMatchIndex - 1;
            setCurrentMatchIndex(prevIndex);
            onJumpToMessage(messages[matchingIndices[prevIndex]]);
        }
    };

    useEffect(() => {
        // Jump to first match when search results change
        if (matchingIndices.length > 0) {
            onJumpToMessage(messages[matchingIndices[0]]);
        }
    }, [matchingIndices]);

    return (
        <div className="bg-[#202c33] border-b border-gray-700 p-3 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
                {/* Search Icon */}
                <FiSearch className="text-gray-400 flex-shrink-0" size={18} />

                {/* Search Input */}
                <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
                />

                {/* Result Count */}
                {searchQuery && (
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                        {matchingIndices.length > 0
                            ? `${currentMatchIndex + 1} of ${matchingIndices.length}`
                            : 'No results'}
                    </span>
                )}

                {/* Navigation Buttons */}
                {matchingIndices.length > 0 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="p-1.5 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
                            title="Previous"
                        >
                            <FiChevronUp size={18} />
                        </button>
                        <button
                            onClick={goToNext}
                            className="p-1.5 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
                            title="Next"
                        >
                            <FiChevronDown size={18} />
                        </button>
                    </>
                )}

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white flex-shrink-0"
                    title="Close search"
                >
                    <FiX size={18} />
                </button>
            </div>
        </div>
    );
};

export default MessageSearch;
