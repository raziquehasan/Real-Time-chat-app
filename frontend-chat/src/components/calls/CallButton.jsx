import React from 'react';
import { FiPhone, FiVideo } from 'react-icons/fi';

const CallButton = ({ onCall, type = 'VOICE', disabled = false }) => {
    return (
        <button
            onClick={() => onCall(type)}
            disabled={disabled}
            className={`p-2 rounded-full transition-all duration-200 ${disabled
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'hover:bg-[#374151] text-gray-400 hover:text-white active:scale-95'
                }`}
            title={type === 'VOICE' ? 'Start Voice Call' : 'Start Video Call'}
        >
            {type === 'VOICE' ? (
                <FiPhone size={20} />
            ) : (
                <FiVideo size={20} />
            )}
        </button>
    );
};

export default CallButton;
