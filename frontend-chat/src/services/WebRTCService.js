class WebRTCService {
    constructor(stompClient, onRemoteStream) {
        this.stompClient = stompClient;
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
                audio: true,
                video: video
            });
            console.log("Local stream acquired:", this.localStream);
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
                targetId,
                data: offer
            })
        });
    }

    async handleOffer(offer, senderId, sessionId) {
        if (!this.localStream) {
            await this.getLocalStream(true);
        }

        const pc = this.createPeerConnection(senderId, sessionId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        this.addLocalStreamToPeer(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log("Answer created and sent to:", senderId);
        this.stompClient.publish({
            destination: '/app/call/answer',
            body: JSON.stringify({
                type: 'call:answer',
                sessionId,
                targetId: senderId,
                data: answer
            })
        });
    }

    async handleAnswer(answer, senderId) {
        const pc = this.peerConnections[senderId];
        if (pc) {
            console.log("Setting remote description (answer) for:", senderId);
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    }

    async handleCandidate(candidate, senderId) {
        const pc = this.peerConnections[senderId];
        if (pc) {
            console.log("Adding ICE candidate from:", senderId);
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
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
