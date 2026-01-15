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

    // IMMEDIATE REF for session tracking to avoid state-update race conditions
    const activeSessionIdRef = useRef(null);

    // 1. Audio Initialization
    useEffect(() => {
        outgoingRingRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3');
        outgoingRingRef.current.loop = true;
        incomingRingRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1358/1358-preview.mp3');
        incomingRingRef.current.loop = true;

        const stopAllSounds = () => {
            if (outgoingRingRef.current) {
                outgoingRingRef.current.pause();
                outgoingRingRef.current.currentTime = 0;
            }
            if (incomingRingRef.current) {
                incomingRingRef.current.pause();
                incomingRingRef.current.currentTime = 0;
            }
        };

        return () => stopAllSounds();
    }, []);

    // 2. Audio State Management
    useEffect(() => {
        const playSound = async (audio) => {
            if (!audio) return;
            try {
                audio.currentTime = 0;
                await audio.play();
            } catch (e) {
                console.warn("Audio play promise rejected (usually ignoreable):", e);
            }
        };

        const stopSound = (audio) => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        };

        if (callStatus === 'OUTGOING') {
            playSound(outgoingRingRef.current);
        } else {
            stopSound(outgoingRingRef.current);
        }

        if (callStatus === 'RINGING') {
            playSound(incomingRingRef.current);
        } else {
            stopSound(incomingRingRef.current);
        }

        // Final safety: kill all sounds if active or idle
        if (callStatus === 'ACTIVE' || callStatus === 'IDLE') {
            stopSound(outgoingRingRef.current);
            stopSound(incomingRingRef.current);
        }
    }, [callStatus]);

    // 3. Cleanup Logic
    const cleanup = useCallback(() => {
        console.log("🧹 Performing Full Cleanup for Session:", activeSessionIdRef.current);
        activeSessionIdRef.current = null;

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

    // 4. Exposed Methods
    useImperativeHandle(ref, () => ({
        initiateCall: async (targetId, type, isGroup = false, groupId = null) => {
            if (callStatus !== 'IDLE') {
                console.warn("Cannot initiate call: Status is", callStatus);
                return;
            }

            try {
                console.log("🚀 Initiating call to:", targetId);
                const isVideo = type === 'VIDEO';
                setIsVideoEnabled(isVideo);

                if (!webRTCServiceRef.current && stompClient && connected) {
                    webRTCServiceRef.current = new WebRTCService(
                        stompClient,
                        currentUser.id,
                        (peerId, stream) => {
                            console.log("🎮 Got Remote Stream for:", peerId);
                            setRemoteStreams(prev => ({ ...prev, [peerId]: stream }));
                        }
                    );
                }

                const stream = await webRTCServiceRef.current.getLocalStream(isVideo);
                setLocalStream(stream);

                // Set status and a skeleton session immediately
                setCallStatus('OUTGOING');
                setCallSession({ id: 'pending', callType: type, groupCall: isGroup, groupId: groupId });
                setInitiator({ id: targetId, name: 'Calling...' });

                const session = await callAPI.startCall({
                    participantIds: [targetId],
                    callType: type,
                    groupCall: isGroup,
                    groupId: groupId
                });

                // Update activeSessionIdRef IMMEDIATELY BEFORE state update
                activeSessionIdRef.current = session.id;
                setCallSession({ id: session.id, callType: type, groupCall: isGroup, groupId: groupId });
                console.log("✅ Call Session Started:", session.id);
            } catch (error) {
                console.error("Initiation Failed:", error);
                toast.error('Failed to start call');
                cleanup();
            }
        }
    }));

    // 5. Media Handlers
    const startWebRTCFlow = useCallback(async (targetId) => {
        if (!activeSessionIdRef.current) {
            console.error("Cannot start WebRTC flow: No active session ID");
            return;
        }
        if (processedSignalsRef.current.has(`flow-${targetId}`)) return;
        processedSignalsRef.current.add(`flow-${targetId}`);

        try {
            console.log("🚀 Starting WebRTC Flow (Offer) for:", targetId);
            const isVideo = callSession?.callType === 'VIDEO';
            const stream = await webRTCServiceRef.current.getLocalStream(isVideo);
            setLocalStream(stream);
            await webRTCServiceRef.current.createOffer(targetId, activeSessionIdRef.current);
            setCallStatus('ACTIVE');
        } catch (error) {
            console.error("WebRTC Flow Error:", error);
            cleanup();
        }
    }, [callSession, cleanup]);

    // 6. Signaling Message Processing
    const handleSignalingMessage = useCallback(async (signal) => {
        const signalId = `${signal.type}-${signal.sessionId}-${signal.senderId || signal.userId || 'system'}`;

        // Candidate deduplication is handled by WebRTCService
        if (signal.type !== 'call:candidate' && processedSignalsRef.current.has(signalId)) {
            return;
        }
        if (signal.type !== 'call:candidate') {
            processedSignalsRef.current.add(signalId);
        }

        switch (signal.type) {
            case 'call:ring':
                console.log("🔔 Incoming Ring:", signal.sessionId);

                // IF WE ARE THE INITIATOR: The backend sends 'ring' to us too.
                // We MUST ignore it if it's our own call.
                if (activeSessionIdRef.current === signal.sessionId) {
                    console.log("Ignoring ring for our own session.");
                    return;
                }

                // If it's a DIFFERENT call and we're busy, decline it.
                if (callStatus !== 'IDLE' && callStatus !== 'RINGING') {
                    console.warn("Busy: Declining incoming ring.");
                    callAPI.declineCall(signal.sessionId);
                    return;
                }

                // Normal Incoming Call Setup
                activeSessionIdRef.current = signal.sessionId;
                setCallSession({ id: signal.sessionId, callType: signal.callType, groupCall: signal.isGroup, groupId: signal.groupId });
                setInitiator({
                    id: signal.initiatorId,
                    name: signal.initiatorName || 'Incoming Call',
                    avatarUrl: signal.initiatorAvatarUrl
                });
                setCallStatus('RINGING');

                if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                    new Notification("Incoming Call", {
                        body: `${signal.initiatorName || 'Someone'} is calling you`,
                        tag: 'incoming-call'
                    });
                }
                break;

            case 'call:offer':
                console.log("📥 Received Offer from:", signal.senderId);
                if (webRTCServiceRef.current && activeSessionIdRef.current === signal.sessionId) {
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
                console.log("📥 Received Answer from:", signal.senderId);
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
                console.log("✅ Peer Accepted Call:", signal.userId);
                toast.success('Call accepted');
                startWebRTCFlow(signal.userId);
                break;

            case 'call:declined':
                toast.error('Call declined');
                cleanup();
                break;

            case 'call:ended':
                console.log("🏁 Call Ended Signal Received");
                toast('Call ended');
                cleanup();
                break;

            default:
                break;
        }
    }, [callStatus, stompClient, startWebRTCFlow, cleanup, currentUser]);

    // 7. Core Lifecycle Effects
    useEffect(() => {
        signalingHandlerRef.current = handleSignalingMessage;
    }, [handleSignalingMessage]);

    useEffect(() => {
        let subscription = null;
        if (stompClient && connected && currentUser) {
            console.log("📡 Initializing signaling context...");

            if (!webRTCServiceRef.current) {
                webRTCServiceRef.current = new WebRTCService(
                    stompClient, currentUser.id,
                    (pId, s) => {
                        console.log("🎮 Remote stream received for:", pId);
                        setRemoteStreams(prev => ({ ...prev, [pId]: s }));
                    }
                );
            }

            subscription = stompClient.subscribe('/user/queue/calls', (message) => {
                if (signalingHandlerRef.current) {
                    signalingHandlerRef.current(JSON.parse(message.body));
                }
            });
        }

        return () => {
            if (subscription) {
                console.log("🔌 Tearing down signaling context...");
                subscription.unsubscribe();
            }
        };
    }, [stompClient, connected, currentUser]);

    // Final guard: Cleanup on unmount
    useEffect(() => {
        return () => {
            if (activeSessionIdRef.current) {
                console.log("🛑 Unmounting: Performing final emergency cleanup");
                cleanup();
            }
        };
    }, [cleanup]);

    // 8. User Interaction Handlers
    const handleAccept = useCallback(async () => {
        if (callStatus !== 'RINGING' || !activeSessionIdRef.current) return;
        try {
            console.log("Picking up call...");
            const isVideo = callSession?.callType === 'VIDEO';
            const stream = await webRTCServiceRef.current.getLocalStream(isVideo);
            setLocalStream(stream);
            await callAPI.acceptCall(activeSessionIdRef.current);
            setCallStatus('ACTIVE');
        } catch (error) {
            console.error("Failed to accept call:", error);
            cleanup();
        }
    }, [callSession, callStatus, cleanup]);

    const handleDecline = useCallback(async () => {
        if (!activeSessionIdRef.current) return;
        try {
            await callAPI.declineCall(activeSessionIdRef.current);
            cleanup();
        } catch (error) {
            cleanup();
        }
    }, [cleanup]);

    const handleEndCall = useCallback(async () => {
        if (!activeSessionIdRef.current) return;
        try {
            await callAPI.endCall(activeSessionIdRef.current);
            cleanup();
        } catch (error) {
            cleanup();
        }
    }, [cleanup]);

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
        <React.Fragment>
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
        </React.Fragment>
    );
});

export default CallContainer;
