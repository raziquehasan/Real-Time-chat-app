class WebRTCService {
    constructor(stompClient, currentUserId, onRemoteStream) {
        this.stompClient = stompClient;
        this.currentUserId = currentUserId;
        this.onRemoteStream = onRemoteStream;
        this.peerConnections = {}; // Support for group calls (mesh)
        this.localStream = null;
        this.config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ]
        };
    }

    async getLocalStream(video = true) {
        console.log("Requesting media devices...");
        if (this.localStream) return this.localStream;

        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: { ideal: true },
                    noiseSuppression: { ideal: true },
                    autoGainControl: { ideal: true },
                    channelCount: 1 // Mono is better for echo cancellation
                },
                video: video
            });
            console.log("Local stream acquired:", this.localStream);
            console.log("Audio tracks:", this.localStream.getAudioTracks().length);
            console.log("Video tracks:", this.localStream.getVideoTracks().length);
            return this.localStream;
        } catch (error) {
            console.error("Error accessing media devices:", error);
            throw error;
        }
    }

    addLocalStreamToPeer(peerConnection) {
        if (!this.localStream) {
            console.error("Local stream not initialized");
            return;
        }

        this.localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, this.localStream);
            console.log("Track added to peer:", track.kind);
        });
    }

    setupPeerEvents(peerConnection, sessionId, targetId) {
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.stompClient.publish({
                    destination: '/app/call/candidate',
                    body: JSON.stringify({
                        type: 'call:candidate',
                        sessionId,
                        senderId: this.currentUserId,
                        targetId,
                        data: event.candidate
                    })
                });
            }
        };

        peerConnection.ontrack = (event) => {
            console.log("Remote stream received from:", targetId);
            if (this.onRemoteStream) {
                this.onRemoteStream(targetId, event.streams[0]);
            }
        };
    }

    createPeerConnection(targetId, sessionId) {
        const pc = new RTCPeerConnection(this.config);
        this.setupPeerEvents(pc, sessionId, targetId);
        this.peerConnections[targetId] = pc;
        return pc;
    }

    async createOffer(targetId, sessionId) {
        if (!this.localStream) {
            await this.getLocalStream(true);
        }

        const pc = this.createPeerConnection(targetId, sessionId);
        this.addLocalStreamToPeer(pc);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        console.log("Offer created and sent to:", targetId);
        this.stompClient.publish({
            destination: '/app/call/offer',
            body: JSON.stringify({
                type: 'call:offer',
                sessionId,
                senderId: this.currentUserId,
                targetId,
                data: offer
            })
        });
    }

    async handleOffer(offer, senderId, sessionId) {
        console.log("Handling incoming offer from:", senderId);

        // 1. Get Local Stream First (Media-First)
        const stream = await this.getLocalStream(true);

        // 2. Create Peer Connection
        const pc = this.createPeerConnection(senderId, sessionId);

        // 3. Set remote offer
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // 4. Attach tracks BEFORE creating answer
        this.addLocalStreamToPeer(pc);

        // 5. Create Answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log("Answer created for:", senderId);

        return { answer, stream };
    }

    async handleAnswer(answer, senderId) {
        const pc = this.peerConnections[senderId];
        if (pc) {
            console.log("Setting remote description (answer) for:", senderId);
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } else {
            console.warn("Received answer but no peer connection found for:", senderId);
        }
    }

    async handleCandidate(candidate, senderId) {
        if (!candidate) return; // End of candidate gathering
        const pc = this.peerConnections[senderId];
        if (pc) {
            console.log("Adding ICE candidate from:", senderId);
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error("Error adding received ice candidate", e);
            }
        } else {
            console.warn("Received ICE candidate but no peer connection found for:", senderId);
        }
    }

    stopLocalStream() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
    }

    closeAllConnections() {
        Object.values(this.peerConnections).forEach(pc => pc.close());
        this.peerConnections = {};
        this.stopLocalStream();
    }
}

export default WebRTCService;
