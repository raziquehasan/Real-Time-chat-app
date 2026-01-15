package com.substring.chat.controllers;

import com.substring.chat.entities.CallSession;
import com.substring.chat.entities.CallStatus;
import com.substring.chat.entities.CallType;
import com.substring.chat.entities.User;
import com.substring.chat.repositories.UserRepository;
import com.substring.chat.services.CallService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calls")
@RequiredArgsConstructor
public class CallController {

    private final CallService callService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/start")
    public ResponseEntity<?> startCall(@RequestBody StartCallRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User initiator = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        CallSession session = callService.startCall(
                initiator.getId(),
                initiator.getName(),
                initiator.getAvatarUrl(),
                request.getParticipantIds(),
                request.getCallType(),
                request.isGroupCall(),
                request.getGroupId());

        return ResponseEntity.ok(session);
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<?> acceptCall(@PathVariable String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        CallSession session = callService.acceptCall(id, user.getId());
        return ResponseEntity.ok(session);
    }

    @PostMapping("/{id}/decline")
    public ResponseEntity<?> declineCall(@PathVariable String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        callService.declineCall(id, user.getId());
        return ResponseEntity.ok(Map.of("message", "Call declined"));
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<?> endCall(@PathVariable String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        callService.endCall(id, user.getId());
        return ResponseEntity.ok(Map.of("message", "Call ended"));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(callService.getHistory(user.getId()));
    }

    // --- WebSocket Signaling Handlers ---

    @MessageMapping("/call/offer")
    public void processOffer(@Payload SignalMessage message) {
        // Forward SDP offer to target user
        messagingTemplate.convertAndSendToUser(message.getTargetId(), "/queue/calls", message);
    }

    @MessageMapping("/call/answer")
    public void processAnswer(@Payload SignalMessage message) {
        // Forward SDP answer to initiator
        messagingTemplate.convertAndSendToUser(message.getTargetId(), "/queue/calls", message);
    }

    @MessageMapping("/call/candidate")
    public void processCandidate(@Payload SignalMessage message) {
        // Forward ICE candidate to target user
        messagingTemplate.convertAndSendToUser(message.getTargetId(), "/queue/calls", message);
    }

    @Data
    public static class StartCallRequest {
        private List<String> participantIds;
        private CallType callType;
        private boolean groupCall;
        private String groupId;
    }

    @Data
    public static class SignalMessage {
        private String type; // call:offer, call:answer, call:candidate
        private String sessionId;
        private String senderId;
        private String targetId;
        private Object data; // SDP or ICE Candidate
    }
}
