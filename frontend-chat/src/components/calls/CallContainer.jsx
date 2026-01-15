import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { callAPI } from '../../services/api';
import WebRTCService from '../../services/WebRTCService';
import IncomingCallModal from './IncomingCallModal';
import ActiveCallUI from './ActiveCallUI';
import toast from 'react-hot-toast';

const CallContainer = forwardRef(({ stompClient, currentUser, connected }, ref) => {
    const [callSession, setCallSession] = useState(null);
    const [callStatus, setCallStatus] = useState('IDLE'); // IDLE, RINGING, OUTGOING, ACTIVE
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({});
    const [initiator, setInitiator] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);

    const webRTCServiceRef = useRef(null);

    useImperativeHandle(ref, () => ({
        initiateCall: async (targetId, type, isGroup = false, groupId = null) => {
            try {
                console.log("Starting outgoing call to:", targetId);
                const isVideo = type === 'VIDEO';
                setIsVideoEnabled(isVideo);

                // 1. Get Local Media First
                const stream = await webRTCServiceRef.current.getLocalStream(isVideo);
                setLocalStream(stream);

                setCallStatus('OUTGOING');
                setCallSession({ id: null, callType: type, groupCall: isGroup, groupId: groupId });
                setInitiator({ id: targetId, name: 'Calling...' }); // Placeholder for recipient info

                // 2. Call Backend API
                const session = await callAPI.startCall({
                    participantIds: [targetId],
                    callType: type,
                    groupCall: isGroup,
                    groupId: groupId
                });

                setCallSession(prev => ({ ...prev, id: session.id }));
                console.log("Backend session started:", session.id);
            } catch (error) {
                console.error("Call Initiation Error:", error);
                toast.error('Could not initiate call');
                cleanup();
            }
        }
    }));

    // Initialize WebRTC Service
    useEffect(() => {
        if (stompClient && connected) {
            webRTCServiceRef.current = new WebRTCService(
                stompClient,
                (peerId, stream) => {
                    setRemoteStreams(prev => ({ ...prev, [peerId]: stream }));
                }
            );

            const subscription = stompClient.subscribe(`/user/${currentUser.id}/queue/calls`, (message) => {
                const signal = JSON.parse(message.body);
                handleSignalingMessage(signal);
            });

            return () => {
                subscription.unsubscribe();
                cleanup();
            };
        }
    }, [stompClient, connected, currentUser.id]);

    const cleanup = () => {
        if (webRTCServiceRef.current) {
            webRTCServiceRef.current.closeAllConnections();
        }
        setLocalStream(null);
        setRemoteStreams({});
        setCallSession(null);
        setCallStatus('IDLE');
        setInitiator(null);
    };

    const handleSignalingMessage = useCallback(async (signal) => {
        switch (signal.type) {
            case 'call:ring':
                if (callStatus !== 'IDLE') {
                    // Send BUSY signal (implementation simplified: decline)
                    callAPI.declineCall(signal.sessionId);
                    return;
                }
                setCallSession({ id: signal.sessionId, callType: signal.callType, groupCall: signal.isGroup, groupId: signal.groupId });
                setInitiator({ id: signal.initiatorId, name: signal.initiatorName || 'Incoming Call' });
                setCallStatus('RINGING');
                break;

            case 'call:offer':
                if (webRTCServiceRef.current) {
                    await webRTCServiceRef.current.handleOffer(signal.data, signal.senderId, signal.sessionId);
                }
                break;

            case 'call:answer':
                if (webRTCServiceRef.current) {
                    await webRTCServiceRef.current.handleAnswer(signal.data, signal.senderId);
                }
                break;

            case 'call:candidate':
                if (webRTCServiceRef.current) {
                    await webRTCServiceRef.current.handleCandidate(signal.data, signal.senderId);
                }
                break;

            case 'call:accepted':
                toast.success('Call accepted');
                // Caller starts the WebRTC offer
                startWebRTCFlow(signal.userId);
                break;

            case 'call:declined':
                toast.error('Call declined');
                cleanup();
                break;

            case 'call:ended':
                toast('Call ended');
                cleanup();
                break;

            default:
                break;
        }
    }, [callStatus]);

    const startWebRTCFlow = async (targetId) => {
        try {
            console.log("Initiating WebRTC flow for:", targetId);
            const isVideo = callSession.callType === 'VIDEO';
            const stream = await webRTCServiceRef.current.getLocalStream(isVideo);
            setLocalStream(stream);
            await webRTCServiceRef.current.createOffer(targetId, callSession.id);
            setCallStatus('ACTIVE');
        } catch (error) {
            console.error("WebRTC Flow Error:", error);
            toast.error('Could not start media stream');
            cleanup();
        }
    };

    const handleAccept = async () => {
        try {
            console.log("Call accepted, preparing media...");
            const isVideo = callSession.callType === 'VIDEO';
            const stream = await webRTCServiceRef.current.getLocalStream(isVideo);
            setLocalStream(stream);

            await callAPI.acceptCall(callSession.id);
            setCallStatus('ACTIVE');
        } catch (error) {
            console.error("Accept Call Error:", error);
            toast.error('Failed to accept call');
            cleanup();
        }
    };

    const handleDecline = async () => {
        try {
            await callAPI.declineCall(callSession.id);
            cleanup();
        } catch (error) {
            cleanup();
        }
    };

    const handleEndCall = async () => {
        try {
            await callAPI.endCall(callSession.id);
            cleanup();
        } catch (error) {
            cleanup();
        }
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => (track.enabled = !track.enabled));
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => (track.enabled = !track.enabled));
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    return (
        <>
            {callStatus === 'RINGING' && (
                <IncomingCallModal
                    callSession={callSession}
                    initiator={initiator}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                />
            )}

            {(callStatus === 'ACTIVE' || callStatus === 'OUTGOING') && (
                <ActiveCallUI
                    localStream={localStream}
                    remoteStreams={remoteStreams}
                    callSession={callSession}
                    onEndCall={handleEndCall}
                    isMuted={isMuted}
                    isVideoEnabled={isVideoEnabled}
                    onToggleMute={toggleMute}
                    onToggleVideo={toggleVideo}
                />
            )}
        </>
    );
});

export default CallContainer;
