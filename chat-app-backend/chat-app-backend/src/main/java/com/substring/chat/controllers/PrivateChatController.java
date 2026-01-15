package com.substring.chat.controllers;

import com.substring.chat.entities.PrivateMessage;
import com.substring.chat.entities.User;
import com.substring.chat.payload.DeleteMessageRequest;
import com.substring.chat.payload.ForwardMessageRequest;
import com.substring.chat.payload.PrivateMessageRequest;
import com.substring.chat.payload.ReactionRequest;
import com.substring.chat.payload.TypingRequest;
import com.substring.chat.repositories.PrivateMessageRepository;
import com.substring.chat.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/private")
public class PrivateChatController {

        @Autowired
        private PrivateMessageRepository privateMessageRepository;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private SimpMessagingTemplate messagingTemplate;

        @Autowired
        private com.substring.chat.services.FileStorageService fileStorageService;

        @Autowired
        private com.substring.chat.services.NotificationService notificationService;

        /**
         * Integrated API for sending files in private chat
         * POST /api/private/send-file
         */
        @PostMapping("/send-file")
        public ResponseEntity<?> sendFile(
                        @RequestParam(value = "file", required = false) org.springframework.web.multipart.MultipartFile file,
                        @RequestParam(value = "receiverId", required = false) String receiverId,
                        @RequestParam(value = "content", required = false) String content) {
                System.out.println("📂 [DEBUG] send-file endpoint hit");
                System.out.println("   - file present: " + (file != null && !file.isEmpty()));
                System.out.println("   - file type: " + (file != null ? file.getContentType() : "NULL"));
                System.out.println("   - receiverId: " + receiverId);
                System.out.println("   - content: " + content);

                if (file == null || file.isEmpty()) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Required part 'file' is missing"));
                }
                if (receiverId == null || receiverId.isEmpty()) {
                        return ResponseEntity.badRequest()
                                        .body(Map.of("message", "Required part 'receiverId' is missing"));
                }
                try {
                        // Get current user
                        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                        String currentUserEmail = authentication.getName();
                        User currentUser = userRepository.findByEmail(currentUserEmail)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        User receiver = userRepository.findById(receiverId)
                                        .orElseThrow(() -> new RuntimeException("Receiver not found"));

                        // 0. Validate File Type
                        String contentType = file.getContentType();
                        boolean isAllowed = contentType != null && (contentType.startsWith("image/") ||
                                        contentType.startsWith("audio/") ||
                                        contentType.equals("application/pdf") ||
                                        contentType.equals("application/msword") ||
                                        contentType.equals(
                                                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                                        ||
                                        contentType.equals("text/plain"));

                        if (!isAllowed) {
                                Map<String, String> error = new HashMap<>();
                                error.put("message", "Only images and documents (PDF, DOC, TXT) are allowed.");
                                return ResponseEntity.badRequest().body(error);
                        }

                        // 1. Upload to Cloudinary
                        com.substring.chat.entities.FileAttachment attachment = fileStorageService.uploadFile(file,
                                        currentUser.getId());

                        // 2. Create and Save PrivateMessage
                        PrivateMessage message = new PrivateMessage(
                                        currentUser.getId(),
                                        currentUser.getName(),
                                        receiverId,
                                        receiver.getName(),
                                        (content == null || content.isEmpty())
                                                        ? "Shared a file: " + file.getOriginalFilename()
                                                        : content);

                        message.setFileUrl(attachment.getFileUrl());
                        message.setFileType(attachment.getFileType());
                        message.setFileName(file.getOriginalFilename());

                        PrivateMessage savedMessage = privateMessageRepository.save(message);

                        // 3. Notify via WebSocket
                        // To Receiver
                        messagingTemplate.convertAndSendToUser(
                                        receiverId,
                                        "/queue/messages",
                                        savedMessage);

                        // To Sender (for confirmation/sync)
                        messagingTemplate.convertAndSendToUser(
                                        currentUser.getId(),
                                        "/queue/messages",
                                        savedMessage);

                        return ResponseEntity.ok(savedMessage);

                } catch (Exception e) {
                        System.out.println("❌ File upload error: " + e.getMessage());
                        e.printStackTrace();
                        Map<String, String> error = new HashMap<>();
                        error.put("message", "Failed to send file: " + e.getMessage());
                        return ResponseEntity.internalServerError().body(error);
                }
        }

        /**
         * Send private message via WebSocket
         * Endpoint: /app/private
         */
        @MessageMapping("/private")
        public void sendPrivateMessage(@Payload PrivateMessageRequest request) {
                System.out.println("📨 Private message from " + request.getSenderName() + " to "
                                + request.getReceiverName());

                // Create and save message
                PrivateMessage message = new PrivateMessage(
                                request.getSenderId(),
                                request.getSenderName(),
                                request.getReceiverId(),
                                request.getReceiverName(),
                                request.getContent());

                if (request.getFileUrl() != null) {
                        message.setFileUrl(request.getFileUrl());
                        message.setFileType(request.getFileType());
                        message.setFileName(request.getFileName());
                }

                PrivateMessage savedMessage = privateMessageRepository.save(message);

                // Send to receiver's personal queue
                messagingTemplate.convertAndSendToUser(
                                request.getReceiverId(),
                                "/queue/messages",
                                savedMessage);

                // Send back to sender for confirmation
                messagingTemplate.convertAndSendToUser(
                                request.getSenderId(),
                                "/queue/messages",
                                savedMessage);

                System.out.println("✅ Private message sent and saved");
        }

        /**
         * Get message history between two users
         * GET /api/private/{userId}/messages
         */
        @GetMapping("/{userId}/messages")
        public ResponseEntity<?> getMessageHistory(
                        @PathVariable String userId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "50") int size) {
                try {
                        // Get current authenticated user
                        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                        String currentUserEmail = authentication.getName();

                        User currentUser = userRepository.findByEmail(currentUserEmail)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        // Create pageable with sorting by timestamp descending
                        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));

                        // Get messages between current user and target user
                        List<PrivateMessage> messages = privateMessageRepository
                                        .findMessagesBetweenUsers(currentUser.getId(), userId, pageable);

                        // Reverse to get chronological order
                        Collections.reverse(messages);

                        return ResponseEntity.ok(messages);

                } catch (Exception e) {
                        Map<String, String> error = new HashMap<>();
                        error.put("message", "Failed to get messages: " + e.getMessage());
                        return ResponseEntity.badRequest().body(error);
                }
        }

        /**
         * Mark messages as read
         * PUT /api/private/mark-read/{senderId}
         */
        @PutMapping("/mark-read/{senderId}")
        public ResponseEntity<?> markMessagesAsRead(@PathVariable String senderId) {
                try {
                        // Get current authenticated user
                        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                        String currentUserEmail = authentication.getName();

                        User currentUser = userRepository.findByEmail(currentUserEmail)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        // Find unread messages from sender to current user
                        List<PrivateMessage> unreadMessages = privateMessageRepository
                                        .findByReceiverIdAndSenderIdAndIsReadFalse(currentUser.getId(), senderId);

                        // Mark all as read
                        LocalDateTime now = LocalDateTime.now();
                        unreadMessages.forEach(message -> {
                                message.setRead(true);
                                message.setReadAt(now);
                        });

                        privateMessageRepository.saveAll(unreadMessages);

                        // Notify sender that messages were read
                        if (!unreadMessages.isEmpty()) {
                                messagingTemplate.convertAndSendToUser(
                                                senderId,
                                                "/queue/read-receipt",
                                                unreadMessages.stream()
                                                                .map(PrivateMessage::getId)
                                                                .collect(Collectors.toList()));
                        }

                        Map<String, Object> response = new HashMap<>();
                        response.put("message", "Messages marked as read");
                        response.put("count", unreadMessages.size());
                        return ResponseEntity.ok(response);

                } catch (Exception e) {
                        Map<String, String> error = new HashMap<>();
                        error.put("message", "Failed to mark messages as read: " + e.getMessage());
                        return ResponseEntity.badRequest().body(error);
                }
        }

        /**
         * Get all conversations for current user
         * GET /api/private/conversations
         */
        @GetMapping("/conversations")
        public ResponseEntity<?> getConversations() {
                try {
                        // Get current authenticated user
                        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                        String currentUserEmail = authentication.getName();

                        User currentUser = userRepository.findByEmail(currentUserEmail)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        // Get latest message for each conversation using Aggregation
                        List<PrivateMessage> latestMessages = privateMessageRepository
                                        .findConversationsAggregation(currentUser.getId());

                        // Collect partner IDs
                        Set<String> partnerIds = latestMessages.stream()
                                        .map(msg -> msg.getSenderId().equals(currentUser.getId()) ? msg.getReceiverId()
                                                        : msg.getSenderId())
                                        .collect(Collectors.toSet());

                        // Fetch all partners efficiently
                        List<User> partners = userRepository.findAllById(partnerIds);
                        Map<String, User> partnerMap = partners.stream()
                                        .collect(Collectors.toMap(User::getId, user -> user));

                        // Map to response
                        List<Map<String, Object>> conversations = latestMessages.stream()
                                        .map(msg -> {
                                                String partnerId = msg.getSenderId().equals(currentUser.getId())
                                                                ? msg.getReceiverId()
                                                                : msg.getSenderId();
                                                User partner = partnerMap.get(partnerId);

                                                Map<String, Object> conversation = new HashMap<>();
                                                conversation.put("userId", partnerId);
                                                conversation.put("userName",
                                                                msg.getSenderId().equals(currentUser.getId())
                                                                                ? msg.getReceiverName()
                                                                                : msg.getSenderName());
                                                conversation.put("lastMessage", msg.getContent());
                                                conversation.put("timestamp", msg.getTimestamp());
                                                conversation.put("isRead",
                                                                msg.getReceiverId().equals(currentUser.getId())
                                                                                ? msg.isRead()
                                                                                : true);

                                                if (partner != null) {
                                                        conversation.put("online", partner.isOnline());
                                                        conversation.put("lastSeen", partner.getLastSeen());
                                                        conversation.put("avatar", partner.getAvatarUrl());
                                                }

                                                return conversation;
                                        })
                                        .sorted((a, b) -> ((LocalDateTime) b.get("timestamp"))
                                                        .compareTo((LocalDateTime) a.get("timestamp")))
                                        .collect(Collectors.toList());

                        return ResponseEntity.ok(conversations);

                } catch (Exception e) {
                        Map<String, String> error = new HashMap<>();
                        error.put("message", "Failed to get conversations: " + e.getMessage());
                        return ResponseEntity.badRequest().body(error);
                }
        }

        /**
         * Get unread message count
         * GET /api/private/unread-count
         */
        @GetMapping("/unread-count")
        public ResponseEntity<?> getUnreadCount() {
                try {
                        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                        String currentUserEmail = authentication.getName();
                        User currentUser = userRepository.findByEmail(currentUserEmail)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        List<PrivateMessage> unreadMessages = privateMessageRepository
                                        .findByReceiverIdAndIsReadFalse(currentUser.getId());
                        Map<String, Long> unreadCountMap = unreadMessages.stream()
                                        .collect(Collectors.groupingBy(PrivateMessage::getSenderId,
                                                        Collectors.counting()));

                        return ResponseEntity.ok(unreadCountMap);
                } catch (Exception e) {
                        Map<String, String> error = new HashMap<>();
                        error.put("message", "Failed to get unread count: " + e.getMessage());
                        return ResponseEntity.badRequest().body(error);
                }
        }

        /**
         * Real-time typing status
         * Endpoint: /app/typing
         */
        @MessageMapping("/typing")
        public void handleTyping(@Payload TypingRequest request) {
                messagingTemplate.convertAndSendToUser(
                                request.getReceiverId(),
                                "/queue/typing",
                                request);
        }

        /**
         * Add emoji reaction to message
         * PUT /api/private/react
         */
        @PutMapping("/react")
        public ResponseEntity<?> reactToMessage(@RequestBody ReactionRequest request) {
                try {
                        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                        String email = authentication.getName();
                        User user = userRepository.findByEmail(email)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        PrivateMessage message = privateMessageRepository.findById(request.getMessageId())
                                        .orElseThrow(() -> new RuntimeException("Message not found"));

                        if (message.getReactions() == null) {
                                message.setReactions(new HashMap<>());
                        }

                        // Add or remove reaction (toggle behavior)
                        if (request.getEmoji().equals(message.getReactions().get(user.getId()))) {
                                message.getReactions().remove(user.getId());
                        } else {
                                message.getReactions().put(user.getId(), request.getEmoji());
                        }

                        privateMessageRepository.save(message);

                        // Notify the other participant via WebSocket
                        String otherUserId = message.getSenderId().equals(user.getId()) ? message.getReceiverId()
                                        : message.getSenderId();

                        Map<String, Object> reactionNotification = new HashMap<>();
                        reactionNotification.put("messageId", message.getId());
                        reactionNotification.put("userId", user.getId());
                        reactionNotification.put("emoji", request.getEmoji());
                        reactionNotification.put("reactions", message.getReactions());

                        messagingTemplate.convertAndSendToUser(
                                        otherUserId,
                                        "/queue/reactions",
                                        reactionNotification);

                        return ResponseEntity.ok(message);
                } catch (Exception e) {
                        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
                }
        }

        /**
         * Forward message to multiple recipients
         * POST /api/private/forward
         */
        @PostMapping("/forward")
        public ResponseEntity<?> forwardMessage(@RequestBody ForwardMessageRequest request) {
                try {
                        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                        String email = authentication.getName();
                        User currentUser = userRepository.findByEmail(email)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        // Get original message
                        PrivateMessage originalMessage = privateMessageRepository.findById(request.getMessageId())
                                        .orElseThrow(() -> new RuntimeException("Message not found"));

                        // Verify user has access to this message
                        if (!originalMessage.getSenderId().equals(currentUser.getId())
                                        && !originalMessage.getReceiverId().equals(currentUser.getId())) {
                                return ResponseEntity.badRequest()
                                                .body(Map.of("message", "You don't have access to this message"));
                        }

                        List<PrivateMessage> forwardedMessages = new ArrayList<>();

                        // Create forwarded message for each recipient
                        for (String receiverId : request.getReceiverIds()) {
                                User receiver = userRepository.findById(receiverId)
                                                .orElseThrow(() -> new RuntimeException(
                                                                "Receiver not found: " + receiverId));

                                PrivateMessage forwardedMessage = new PrivateMessage(
                                                currentUser.getId(),
                                                currentUser.getName(),
                                                receiverId,
                                                receiver.getName(),
                                                originalMessage.getContent());

                                // Copy file attachments if present
                                if (originalMessage.getFileUrl() != null) {
                                        forwardedMessage.setFileUrl(originalMessage.getFileUrl());
                                        forwardedMessage.setFileType(originalMessage.getFileType());
                                        forwardedMessage.setFileName(originalMessage.getFileName());
                                }

                                // Set forwarding metadata
                                forwardedMessage.setForwardedFromId(originalMessage.getId());
                                forwardedMessage.setForwardedFromName(originalMessage.getSenderName());

                                PrivateMessage savedMessage = privateMessageRepository.save(forwardedMessage);
                                forwardedMessages.add(savedMessage);

                                // Notify receiver via WebSocket
                                messagingTemplate.convertAndSendToUser(
                                                receiverId,
                                                "/queue/messages",
                                                savedMessage);

                                // Notify sender for confirmation
                                messagingTemplate.convertAndSendToUser(
                                                currentUser.getId(),
                                                "/queue/messages",
                                                savedMessage);
                        }

                        Map<String, Object> response = new HashMap<>();
                        response.put("message", "Message forwarded successfully");
                        response.put("count", forwardedMessages.size());
                        response.put("forwardedMessages", forwardedMessages);

                        return ResponseEntity.ok(response);
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(Map.of("message", "Failed to forward: " + e.getMessage()));
                }
        }

        /**
         * Delete message (soft delete)
         * DELETE /api/private/messages/{messageId}
         */
        @DeleteMapping("/messages/{messageId}")
        public ResponseEntity<?> deleteMessage(
                        @PathVariable String messageId,
                        @RequestParam String deleteType) {
                try {
                        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                        String email = authentication.getName();
                        User currentUser = userRepository.findByEmail(email)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        PrivateMessage message = privateMessageRepository.findById(messageId)
                                        .orElseThrow(() -> new RuntimeException("Message not found"));

                        // Verify user has access to this message
                        if (!message.getSenderId().equals(currentUser.getId())
                                        && !message.getReceiverId().equals(currentUser.getId())) {
                                return ResponseEntity.badRequest()
                                                .body(Map.of("message", "You don't have access to this message"));
                        }

                        if ("FOR_ME".equals(deleteType)) {
                                // Add current user to deletedFor set
                                if (message.getDeletedFor() == null) {
                                        message.setDeletedFor(new HashSet<>());
                                }
                                message.getDeletedFor().add(currentUser.getId());
                                privateMessageRepository.save(message);

                                return ResponseEntity.ok(Map.of(
                                                "message", "Message deleted for you",
                                                "messageId", messageId,
                                                "deleteType", "FOR_ME"));

                        } else if ("FOR_EVERYONE".equals(deleteType)) {
                                // Only sender can delete for everyone
                                if (!message.getSenderId().equals(currentUser.getId())) {
                                        return ResponseEntity.badRequest()
                                                        .body(Map.of("message", "Only sender can delete for everyone"));
                                }

                                // Mark as deleted for everyone
                                message.setDeletedForEveryone(true);
                                message.setDeletedAt(LocalDateTime.now());
                                privateMessageRepository.save(message);

                                // Notify other participant via WebSocket
                                String otherUserId = message.getReceiverId().equals(currentUser.getId())
                                                ? message.getSenderId()
                                                : message.getReceiverId();

                                Map<String, Object> deleteNotification = new HashMap<>();
                                deleteNotification.put("messageId", messageId);
                                deleteNotification.put("deleteType", "FOR_EVERYONE");
                                deleteNotification.put("deletedBy", currentUser.getId());

                                messagingTemplate.convertAndSendToUser(
                                                otherUserId,
                                                "/queue/delete-message",
                                                deleteNotification);

                                return ResponseEntity.ok(Map.of(
                                                "message", "Message deleted for everyone",
                                                "messageId", messageId,
                                                "deleteType", "FOR_EVERYONE"));
                        } else {
                                return ResponseEntity.badRequest()
                                                .body(Map.of("message",
                                                                "Invalid delete type. Use FOR_ME or FOR_EVERYONE"));
                        }
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(Map.of("message", "Failed to delete: " + e.getMessage()));
                }
        }

        /**
         * Search messages between users
         * GET /api/private/{userId}/search
         */
        @GetMapping("/{userId}/search")
        public ResponseEntity<?> searchMessages(
                        @PathVariable String userId,
                        @RequestParam String query,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "50") int size) {
                try {
                        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                        String currentUserEmail = authentication.getName();
                        User currentUser = userRepository.findByEmail(currentUserEmail)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        // Create pageable with sorting by timestamp descending
                        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));

                        // Search messages
                        List<PrivateMessage> messages = privateMessageRepository
                                        .searchMessagesBetweenUsers(currentUser.getId(), userId, query, pageable);

                        // Filter out deleted messages for current user
                        List<PrivateMessage> filteredMessages = messages.stream()
                                        .filter(msg -> !msg.isDeletedForEveryone()
                                                        && (msg.getDeletedFor() == null
                                                                        || !msg.getDeletedFor()
                                                                                        .contains(currentUser.getId())))
                                        .collect(Collectors.toList());

                        // Reverse to get chronological order
                        Collections.reverse(filteredMessages);

                        Map<String, Object> response = new HashMap<>();
                        response.put("messages", filteredMessages);
                        response.put("count", filteredMessages.size());
                        response.put("query", query);

                        return ResponseEntity.ok(response);
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(Map.of("message", "Search failed: " + e.getMessage()));
                }
        }
}
