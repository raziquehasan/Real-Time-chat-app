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

    const cleanup = useCallback(() => {
        console.log("🧹 Cleaning up call state and stopping items...");
        if (webRTCServiceRef.current) {
            webRTCServiceRef.current.closeAllConnections();
        }

        // Stop all sounds explicitly
        if (outgoingRingRef.current) {
            outgoingRingRef.current.pause();
            outgoingRingRef.current.currentTime = 0;
        }
        if (incomingRingRef.current) {
            incomingRingRef.current.pause();
            incomingRingRef.current.currentTime = 0;
        }

        setLocalStream(null);
        setRemoteStreams({});
        setCallSession(null);
        setCallStatus('IDLE');
        setInitiator(null);
        processedSignalsRef.current.clear();
    }, []);

    useImperativeHandle(ref, () => ({
        initiateCall: async (targetId, type, isGroup = false, groupId = null) => {
            if (callStatus !== 'IDLE') {
                console.warn("⚠️ Call already in progress, ignoring request");
                return;
            }
            try {
                console.log("🚀 Starting outgoing call to:", targetId);
                const isVideo = type === 'VIDEO';
                setIsVideoEnabled(isVideo);

                if (!webRTCServiceRef.current) {
                    if (stompClient && connected) {
                        webRTCServiceRef.current = new WebRTCService(
                            stompClient,
                            currentUser.id,
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
                setInitiator({ id: targetId, name: 'Calling...' });

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

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const showNotification = useCallback((title, options) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, options);
        }
    }, []);

    const handleSignalingMessage = useCallback(async (signal) => {
        const signalId = `${signal.type}-${signal.sessionId}-${signal.senderId || signal.userId || 'system'}`;

        // Don't deduplicate candidates - they are multiple by nature
        if (signal.type !== 'call:candidate' && processedSignalsRef.current.has(signalId)) {
            return;
        }
        if (signal.type !== 'call:candidate') {
            processedSignalsRef.current.add(signalId);
        }

        switch (signal.type) {
            case 'call:ring':
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

                    stompClient.publish({
                        destination: '/app/call/answer',
                        body: JSON.stringify({
                            type: 'call:answer',
                            sessionId: signal.sessionId,
                            senderId: currentUser.id,
                            targetId: signal.senderId,
                            data: answer
                        })
                    });
                }
                break;

            case 'call:answer':
                console.log("📥 Incoming Answer received from:", signal.senderId);
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
                console.log("✅ Call Accepted by:", signal.userId);
                toast.success('Call accepted');
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
    }, [callStatus, stompClient, startWebRTCFlow, cleanup, currentUser, showNotification]);

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
