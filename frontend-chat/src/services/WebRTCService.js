class WebRTCService {
    constructor(stompClient, onRemoteStream, onIceCandidate) {
        this.stompClient = stompClient;
        this.onRemoteStream = onRemoteStream;
        this.onIceCandidate = onIceCandidate;
        this.peerConnections = {}; // Support for group calls (mesh)
        this.localStream = null;
        this.config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ]
        };
    }

    async getLocalStream(video = true, audio = true) {
        if (this.localStream) return this.localStream;
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({ video, audio });
            return this.localStream;
        } catch (error) {
            console.error("Error accessing media devices:", error);
            throw error;
        }
    }

    createPeerConnection(targetId, sessionId) {
        const pc = new RTCPeerConnection(this.config);

        pc.onicecandidate = (event) => {
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

        pc.ontrack = (event) => {
            if (this.onRemoteStream) {
                this.onRemoteStream(targetId, event.streams[0]);
            }
        };

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                pc.addTrack(track, this.localStream);
            });
        }

        this.peerConnections[targetId] = pc;
        return pc;
    }

    async createOffer(targetId, sessionId) {
        const pc = this.createPeerConnection(targetId, sessionId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

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
        const pc = this.createPeerConnection(senderId, sessionId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

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
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    }

    async handleCandidate(candidate, senderId) {
        const pc = this.peerConnections[senderId];
        if (pc) {
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
