package com.substring.chat.services;

import com.substring.chat.entities.CallSession;
import com.substring.chat.entities.CallStatus;
import com.substring.chat.entities.CallType;
import com.substring.chat.repositories.CallHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CallService {

    private final CallHistoryRepository callHistoryRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public CallSession startCall(String initiatorId, List<String> participantIds, CallType type, boolean isGroup,
            String groupId) {
        // Create new session
        CallSession session = CallSession.builder()
                .initiatorId(initiatorId)
                .participantIds(participantIds)
                .callType(type)
                .status(CallStatus.RINGING)
                .startedAt(LocalDateTime.now())
                .groupCall(isGroup)
                .groupId(groupId)
                .build();

        CallSession savedSession = callHistoryRepository.save(session);

        // Notify participants (Signaling: Ring)
        Map<String, Object> ringPayload = new HashMap<>();
        ringPayload.put("type", "call:ring");
        ringPayload.put("sessionId", savedSession.getId());
        ringPayload.put("initiatorId", initiatorId);
        ringPayload.put("callType", type);
        ringPayload.put("isGroup", isGroup);
        ringPayload.put("groupId", groupId);

        for (String participantId : participantIds) {
            messagingTemplate.convertAndSendToUser(participantId, "/queue/calls", ringPayload);
        }

        return savedSession;
    }

    public CallSession acceptCall(String sessionId, String userId) {
        CallSession session = callHistoryRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        session.setStatus(CallStatus.ACTIVE);
        CallSession updated = callHistoryRepository.save(session);

        // Notify initiator that call is accepted
        Map<String, Object> acceptPayload = new HashMap<>();
        acceptPayload.put("type", "call:accepted");
        acceptPayload.put("sessionId", sessionId);
        acceptPayload.put("userId", userId);

        messagingTemplate.convertAndSendToUser(session.getInitiatorId(), "/queue/calls", acceptPayload);

        return updated;
    }

    public void declineCall(String sessionId, String userId) {
        CallSession session = callHistoryRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        session.setStatus(CallStatus.DECLINED);
        session.setEndedAt(LocalDateTime.now());
        callHistoryRepository.save(session);

        // Notify others
        Map<String, Object> declinePayload = new HashMap<>();
        declinePayload.put("type", "call:declined");
        declinePayload.put("sessionId", sessionId);
        declinePayload.put("userId", userId);

        messagingTemplate.convertAndSendToUser(session.getInitiatorId(), "/queue/calls", declinePayload);
    }

    public void endCall(String sessionId, String userId) {
        CallSession session = callHistoryRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getStatus() != CallStatus.ENDED) {
            session.setStatus(CallStatus.ENDED);
            session.setEndedAt(LocalDateTime.now());
            callHistoryRepository.save(session);

            // Notify all participants
            Map<String, Object> endPayload = new HashMap<>();
            endPayload.put("type", "call:ended");
            endPayload.put("sessionId", sessionId);
            endPayload.put("endedBy", userId);

            messagingTemplate.convertAndSendToUser(session.getInitiatorId(), "/queue/calls", endPayload);
            for (String pid : session.getParticipantIds()) {
                messagingTemplate.convertAndSendToUser(pid, "/queue/calls", endPayload);
            }
        }
    }

    public List<CallSession> getHistory(String userId) {
        return callHistoryRepository.findByUserIdOrderByStartedAtDesc(userId);
    }
}
