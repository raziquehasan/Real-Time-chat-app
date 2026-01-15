package com.substring.chat.controllers;

import com.substring.chat.entities.GroupMessage;
import com.substring.chat.entities.User;
import com.substring.chat.repositories.GroupMessageRepository;
import com.substring.chat.repositories.UserRepository;
import com.substring.chat.services.GroupPermissionService;
import com.substring.chat.services.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups/{groupId}/messages")
public class GroupMessageController {

    @Autowired
    private GroupMessageRepository messageRepository;

    @Autowired
    private GroupService groupService;

    @Autowired
    private GroupPermissionService permissionService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * GET /api/groups/{groupId}/messages - Get group messages with pagination
     */
    @GetMapping
    public ResponseEntity<?> getMessages(
            @PathVariable String groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate membership
        if (!groupService.validateMembership(groupId, user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not a member of this group"));
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<GroupMessage> messages = messageRepository
                .findByGroupIdAndDeletedForEveryoneFalseOrderByTimestampDesc(groupId, pageable);

        return ResponseEntity.ok(messages);
    }

    /**
     * POST /api/groups/{groupId}/messages - Send message to group
     */
    @PostMapping
    public ResponseEntity<?> sendMessage(
            @PathVariable String groupId,
            @RequestBody SendMessageRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate permission
        if (!permissionService.validatePermission(groupId, user.getId(), "SEND_MESSAGE")) {
            return ResponseEntity.status(403).body(Map.of("error", "Insufficient permissions"));
        }

        GroupMessage message = new GroupMessage();
        message.setGroupId(groupId);
        message.setSenderId(user.getId());
        message.setSenderName(user.getName());
        message.setSenderAvatar(user.getProfilePicture());
        message.setContent(request.getContent());
        message.setMentionedUserIds(request.getMentionedUserIds());
        message.setTimestamp(LocalDateTime.now());

        // Handle reply
        if (request.getReplyToMessageId() != null) {
            messageRepository.findById(request.getReplyToMessageId()).ifPresent(replyMsg -> {
                GroupMessage.ReplyDetails reply = new GroupMessage.ReplyDetails();
                reply.setMessageId(replyMsg.getId());
                reply.setContent(replyMsg.getContent());
                reply.setSenderName(replyMsg.getSenderName());
                message.setReplyTo(reply);
            });
        }

        GroupMessage saved = messageRepository.save(message);

        // Broadcast to group
        messagingTemplate.convertAndSend("/topic/group/" + groupId, saved);

        return ResponseEntity.ok(saved);
    }

    /**
     * POST /api/groups/{groupId}/polls - Create poll
     */
    @PostMapping("/polls")
    public ResponseEntity<?> createPoll(
            @PathVariable String groupId,
            @RequestBody CreatePollRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate permission
        if (!permissionService.validatePermission(groupId, user.getId(), "CREATE_POLL")) {
            return ResponseEntity.status(403).body(Map.of("error", "Insufficient permissions"));
        }

        GroupMessage message = new GroupMessage();
        message.setGroupId(groupId);
        message.setSenderId(user.getId());
        message.setSenderName(user.getName());
        message.setSenderAvatar(user.getProfilePicture());
        message.setContent("📊 " + request.getQuestion());
        message.setTimestamp(LocalDateTime.now());

        // Create poll
        GroupMessage.PollData poll = new GroupMessage.PollData();
        poll.setQuestion(request.getQuestion());
        poll.setOptions(request.getOptions());
        poll.setMultipleChoice(request.isMultipleChoice());
        poll.setExpiresAt(request.getExpiresAt());
        message.setPoll(poll);

        GroupMessage saved = messageRepository.save(message);

        // Broadcast to group
        messagingTemplate.convertAndSend("/topic/group/" + groupId, saved);

        return ResponseEntity.ok(saved);
    }

    /**
     * PUT /api/groups/{groupId}/pin/{messageId} - Pin/unpin message
     */
    @PutMapping("/pin/{messageId}")
    public ResponseEntity<?> togglePin(
            @PathVariable String groupId,
            @PathVariable String messageId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate permission
        if (!permissionService.validatePermission(groupId, user.getId(), "PIN_MESSAGE")) {
            return ResponseEntity.status(403).body(Map.of("error", "Insufficient permissions"));
        }

        GroupMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        message.setPinned(!message.isPinned());
        GroupMessage updated = messageRepository.save(message);

        // Broadcast pin event
        Map<String, Object> event = Map.of(
                "type", "MESSAGE_PINNED",
                "messageId", messageId,
                "isPinned", updated.isPinned());
        messagingTemplate.convertAndSend("/topic/group/" + groupId + "/events", event);

        return ResponseEntity.ok(updated);
    }

    /**
     * WebSocket handler for sending messages
     */
    @MessageMapping("/group/{groupId}/send")
    public void sendMessageViaWebSocket(
            @DestinationVariable String groupId,
            @Payload GroupMessage message) {
        message.setTimestamp(LocalDateTime.now());
        GroupMessage saved = messageRepository.save(message);

        // Broadcast to group
        messagingTemplate.convertAndSend("/topic/group/" + groupId, saved);
    }

    // DTOs
    public static class SendMessageRequest {
        private String content;
        private List<String> mentionedUserIds;
        private String replyToMessageId;

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public List<String> getMentionedUserIds() {
            return mentionedUserIds;
        }

        public void setMentionedUserIds(List<String> mentionedUserIds) {
            this.mentionedUserIds = mentionedUserIds;
        }

        public String getReplyToMessageId() {
            return replyToMessageId;
        }

        public void setReplyToMessageId(String replyToMessageId) {
            this.replyToMessageId = replyToMessageId;
        }
    }

    public static class CreatePollRequest {
        private String question;
        private List<GroupMessage.PollOption> options;
        private boolean multipleChoice;
        private LocalDateTime expiresAt;

        public String getQuestion() {
            return question;
        }

        public void setQuestion(String question) {
            this.question = question;
        }

        public List<GroupMessage.PollOption> getOptions() {
            return options;
        }

        public void setOptions(List<GroupMessage.PollOption> options) {
            this.options = options;
        }

        public boolean isMultipleChoice() {
            return multipleChoice;
        }

        public void setMultipleChoice(boolean multipleChoice) {
            this.multipleChoice = multipleChoice;
        }

        public LocalDateTime getExpiresAt() {
            return expiresAt;
        }

        public void setExpiresAt(LocalDateTime expiresAt) {
            this.expiresAt = expiresAt;
        }
    }
}
