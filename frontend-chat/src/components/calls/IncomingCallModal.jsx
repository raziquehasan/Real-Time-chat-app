import React, { useEffect, useState } from 'react';
import { FiPhone, FiPhoneOff, FiX } from 'react-icons/fi';

const IncomingCallModal = ({ callSession, initiator, onAccept, onDecline }) => {
    useEffect(() => {
        // Sound is managed globally by CallContainer
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#202c33] w-full max-w-sm rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00a884] to-[#005c4b] flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-[#00a884] animate-ping opacity-25"></div>
                    {initiator?.avatarUrl ? (
                        <img src={initiator.avatarUrl} alt={initiator.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <span className="text-4xl text-white font-bold">{initiator?.name?.charAt(0) || '?'}</span>
                    )}
                </div>

                <h2 className="text-2xl text-white font-semibold mb-2">{initiator?.name || 'Unknown Caller'}</h2>
                <p className="text-gray-400 mb-8">Incoming {callSession.callType === 'VIDEO' ? 'Video' : 'Voice'} Call...</p>

                <div className="flex gap-12">
                    <button
                        onClick={onDecline}
                        className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-all active:scale-90 shadow-lg shadow-red-500/20"
                        title="Decline"
                    >
                        <FiPhoneOff size={24} className="rotate-[135deg]" />
                    </button>
                    <button
                        onClick={onAccept}
                        className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-all animate-bounce active:scale-90 shadow-lg shadow-green-500/20"
                        title="Accept"
                    >
                        <FiPhone size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallModal;
