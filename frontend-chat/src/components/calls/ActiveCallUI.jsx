import React, { useState, useEffect, useRef } from 'react';
import CallControls from './CallControls';
import { FiMaximize, FiMinimize, FiMoreHorizontal } from 'react-icons/fi';

const ActiveCallUI = ({
    localStream,
    remoteStreams,
    callSession,
    onEndCall,
    onToggleMute,
    onToggleVideo,
    isMuted,
    isVideoEnabled
}) => {
    const [duration, setDuration] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Use refs for stable video attachment
    const localVideoRef = useRef(null);
    const remoteVideoRefs = useRef({});

    useEffect(() => {
        const timer = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Attach local stream
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            console.log("Attaching local stream to video element");
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, isVideoEnabled]);

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`fixed z-[100] transition-all duration-500 ease-in-out bg-[#0b141a] overflow-hidden ${isFullScreen
            ? 'inset-0'
            : 'bottom-4 right-4 w-[400px] h-[600px] rounded-2xl shadow-2xl border border-white/10'
            }`}>
            {/* Header / Info */}
            <div className="absolute top-0 inset-x-0 p-6 z-20 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-white font-medium text-lg">
                            {callSession.groupCall ? `Group: ${callSession.groupId}` : 'In Call'}
                        </span>
                        <span className="text-gray-300 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            {formatDuration(duration)}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                    >
                        {isFullScreen ? <FiMinimize size={20} /> : <FiMaximize size={20} />}
                    </button>
                    <button className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
                        <FiMoreHorizontal size={20} />
                    </button>
                </div>
            </div>

            {/* Video Grid */}
            <div className="w-full h-full relative grid grid-cols-1 gap-1 bg-black">
                {/* Remote Video(s) */}
                {Object.entries(remoteStreams).map(([peerId, stream]) => (
                    <div key={peerId} className="relative w-full h-full bg-gray-900 overflow-hidden flex items-center justify-center">
                        <video
                            autoPlay
                            playsInline
                            ref={el => {
                                if (el) {
                                    el.srcObject = stream;
                                    console.log("Remote stream attached for:", peerId);
                                }
                            }}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 left-4 text-white text-xs bg-black/40 px-2 py-1 rounded">
                            Connected
                        </div>
                    </div>
                ))}

                {/* Local Video Preview */}
                <div className={`absolute transition-all duration-300 z-10 overflow-hidden border border-white/20 bg-gray-800 ${isFullScreen
                    ? 'bottom-24 right-6 w-36 h-56 rounded-xl shadow-lg'
                    : 'bottom-24 right-4 w-24 h-36 rounded-lg shadow-md'
                    }`}>
                    {isVideoEnabled ? (
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover mirror"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40 text-xs text-center p-2">
                            Camera Off
                        </div>
                    )}
                </div>

                {/* Empty State if no remote stream yet */}
                {Object.keys(remoteStreams).length === 0 && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
                        <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500/40"></div>
                        </div>
                        <p className="text-gray-400 font-medium">Connecting...</p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-6 inset-x-0 flex justify-center z-20">
                <CallControls
                    isMuted={isMuted}
                    isVideoEnabled={isVideoEnabled}
                    onToggleMute={onToggleMute}
                    onToggleVideo={onToggleVideo}
                    onEndCall={onEndCall}
                />
            </div>

            <style jsx>{`
                .mirror {
                    transform: scaleX(-1);
                }
            `}</style>
        </div>
    );
};

export default ActiveCallUI;
