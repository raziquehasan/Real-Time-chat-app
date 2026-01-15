import React from 'react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, FiMaximize2, FiMaximize } from 'react-icons/fi';

const CallControls = ({
    isMuted,
    isVideoEnabled,
    onToggleMute,
    onToggleVideo,
    onEndCall,
    isLocal = true
}) => {
    return (
        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-2xl">
            <button
                onClick={onToggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
            >
                {isMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
            </button>

            <button
                onClick={onToggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${isVideoEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'
                    }`}
            >
                {isVideoEnabled ? <FiVideo size={20} /> : <FiVideoOff size={20} />}
            </button>

            <button
                onClick={onEndCall}
                className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-700 transition-all active:scale-90 shadow-lg shadow-red-600/30"
            >
                <FiPhoneOff size={24} />
            </button>
        </div>
    );
};

export default CallControls;
