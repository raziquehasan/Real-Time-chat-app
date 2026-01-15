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
    const signalingHandlerRef = useRef(null);
    const processedSignalsRef = useRef(new Set());
    const outgoingRingRef = useRef(null);
    const incomingRingRef = useRef(null);

    // Sound initialization
    useEffect(() => {
        // High-quality ringtone links
        outgoingRingRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3');
        outgoingRingRef.current.loop = true;
        incomingRingRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1358/1358-preview.mp3');
        incomingRingRef.current.loop = true;

        return () => {
            outgoingRingRef.current?.pause();
            incomingRingRef.current?.pause();
        };
    }, []);

    // Sound logic based on status
    useEffect(() => {
        if (callStatus === 'OUTGOING') {
            outgoingRingRef.current?.play().catch(e => console.error("Sound play blocked:", e));
        } else {
            outgoingRingRef.current?.pause();
            if (outgoingRingRef.current) outgoingRingRef.current.currentTime = 0;
        }

        if (callStatus === 'RINGING') {
            incomingRingRef.current?.play().catch(e => console.error("Sound play blocked:", e));
        } else {
            incomingRingRef.current?.pause();
            if (incomingRingRef.current) incomingRingRef.current.currentTime = 0;
        }
    }, [callStatus]);

    useImperativeHandle(ref, () => ({
        initiateCall: async (targetId, type, isGroup = false, groupId = null) => {
            try {
                console.log("Starting outgoing call to:", targetId);
                const isVideo = type === 'VIDEO';
                setIsVideoEnabled(isVideo);

                // 1. Get Local Media First
                if (!webRTCServiceRef.current) {
                    console.error("WebRTC Service not initialized. Attempting recovery...");
                    if (stompClient && connected) {
                        webRTCServiceRef.current = new WebRTCService(
                            stompClient,
                            (peerId, stream) => {
                                setRemoteStreams(prev => ({ ...prev, [peerId]: stream }));
                            }
                        );
                    } else {
                        throw new Error("Cannot initiate call: Connectivity lost.");
                    }
                }

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

    // 2. Callbacks
    const cleanup = useCallback(() => {
        if (webRTCServiceRef.current) {
            webRTCServiceRef.current.closeAllConnections();
        }
        setLocalStream(null);
        setRemoteStreams({});
        setCallSession(null);
        setCallStatus('IDLE');
        setInitiator(null);
        processedSignalsRef.current.clear();
    }, []);

    const startWebRTCFlow = useCallback(async (targetId) => {
        if (processedSignalsRef.current.has(`flow-${targetId}`)) return;
        processedSignalsRef.current.add(`flow-${targetId}`);

        try {
            console.log("🚀 Initiating WebRTC flow for:", targetId);
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
    }, [callSession, cleanup]);

    // Notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // ... Sound logic ...

    const showNotification = useCallback((title, options) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, options);
        }
    }, []);

    const handleSignalingMessage = useCallback(async (signal) => {
        // Signal deduplication
        const signalId = `${signal.type}-${signal.sessionId}-${signal.senderId || signal.userId || 'system'}`;
        if (processedSignalsRef.current.has(signalId)) {
            return;
        }

        switch (signal.type) {
            case 'call:ring':
                if (processedSignalsRef.current.has(`ring-${signal.sessionId}`)) return;
                processedSignalsRef.current.add(`ring-${signal.sessionId}`);

                console.log("🔔 Call Ringing Signal Received:", signal);
                if (callStatus !== 'IDLE' && callStatus !== 'RINGING') {
                    callAPI.declineCall(signal.sessionId);
                    return;
                }

                showNotification("Incoming Call", {
                    body: `${signal.initiatorName || 'Someone'} is calling you`,
                    icon: '/favicon.ico',
                    tag: 'incoming-call'
                });

                setCallSession({ id: signal.sessionId, callType: signal.callType, groupCall: signal.isGroup, groupId: signal.groupId });
                setInitiator({
                    id: signal.initiatorId,
                    name: signal.initiatorName || 'Incoming Call',
                    avatarUrl: signal.initiatorAvatarUrl
                });
                setCallStatus('RINGING');
                break;

            case 'call:offer':
                console.log("📥 Incoming Offer received from:", signal.senderId);
                if (webRTCServiceRef.current) {
                    const { answer, stream } = await webRTCServiceRef.current.handleOffer(signal.data, signal.senderId, signal.sessionId);
                    setLocalStream(stream);
                    setCallStatus('ACTIVE');

                    console.log("📤 Sending Answer to:", signal.senderId);
                    stompClient.publish({
                        destination: '/app/call/answer',
                        body: JSON.stringify({
                            type: 'call:answer',
                            sessionId: signal.sessionId,
                            senderId: currentUser.id, // Fixed: Added senderId
                            targetId: signal.senderId,
                            data: answer
                        })
                    });
                } else {
                    console.error("WebRTC Service not available for offer");
                }
                break;

            case 'call:answer':
                console.log("📥 Incoming Answer received from:", signal.senderId);
                if (webRTCServiceRef.current) {
                    await webRTCServiceRef.current.handleAnswer(signal.data, signal.senderId);
                } else {
                    console.error("WebRTC Service not available for answer");
                }
                break;

            case 'call:candidate':
                console.log("📥 Incoming ICE Candidate from:", signal.senderId);
                if (webRTCServiceRef.current) {
                    await webRTCServiceRef.current.handleCandidate(signal.data, signal.senderId);
                }
                break;

            case 'call:accepted':
                console.log("✅ Call Accepted by:", signal.userId);
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
    }, [callStatus, stompClient, startWebRTCFlow, cleanup, currentUser]);

    // 3. Effects (Restored critical initialization)
    useEffect(() => {
        signalingHandlerRef.current = handleSignalingMessage;
    }, [handleSignalingMessage]);

    useEffect(() => {
        if (stompClient && connected && currentUser) {
            console.log("Initializing WebRTC Service via Effect...");
            webRTCServiceRef.current = new WebRTCService(
                stompClient,
                currentUser.id,
                (peerId, stream) => {
                    setRemoteStreams(prev => ({ ...prev, [peerId]: stream }));
                }
            );

            const subscription = stompClient.subscribe('/user/queue/calls', (message) => {
                if (signalingHandlerRef.current) {
                    signalingHandlerRef.current(JSON.parse(message.body));
                }
            });

            return () => {
                subscription.unsubscribe();
                cleanup();
            };
        }
    }, [stompClient, connected, currentUser, cleanup]);

    const handleAccept = useCallback(async () => {
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
    }, [callSession, cleanup]);

    const handleDecline = useCallback(async () => {
        try {
            await callAPI.declineCall(callSession.id);
            cleanup();
        } catch (error) {
            cleanup();
        }
    }, [callSession, cleanup]);

    const handleEndCall = useCallback(async () => {
        try {
            await callAPI.endCall(callSession?.id);
            cleanup();
        } catch (error) {
            cleanup();
        }
    }, [callSession, cleanup]);

    const toggleMute = useCallback(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => (track.enabled = !track.enabled));
            setIsMuted(prev => !prev);
        }
    }, [localStream]);

    const toggleVideo = useCallback(() => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => (track.enabled = !track.enabled));
            setIsVideoEnabled(prev => !prev);
        }
    }, [localStream]);

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
                    otherParticipant={initiator}
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
