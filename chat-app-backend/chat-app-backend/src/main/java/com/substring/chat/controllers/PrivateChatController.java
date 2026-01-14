package com.substring.chat.controllers;

import com.substring.chat.entities.PrivateMessage;
import com.substring.chat.entities.User;
import com.substring.chat.payload.PrivateMessageRequest;
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
@CrossOrigin(origins = "http://localhost:*")
public class PrivateChatController {

        @Autowired
        private PrivateMessageRepository privateMessageRepository;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private SimpMessagingTemplate messagingTemplate;

        @Autowired
        private com.substring.chat.services.FileStorageService fileStorageService;

        /**
         * Integrated API for sending files in private chat
         * POST /api/private/send-file
         */
        @PostMapping("/send-file")
        public ResponseEntity<?> sendFile(
                        @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
                        @RequestParam("receiverId") String receiverId,
                        @RequestParam(value = "content", required = false) String content) {
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
                        Map<String, String> error = new HashMap<>();
                        error.put("message", "Failed to send file: " + e.getMessage());
                        return ResponseEntity.badRequest().body(error);
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
                        // Get current authenticated user
                        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                        String currentUserEmail = authentication.getName();

                        User currentUser = userRepository.findByEmail(currentUserEmail)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        long count = privateMessageRepository.countByReceiverIdAndIsReadFalse(currentUser.getId());

                        Map<String, Object> response = new HashMap<>();
                        response.put("count", count);
                        return ResponseEntity.ok(response);

                } catch (Exception e) {
                        Map<String, String> error = new HashMap<>();
                        error.put("message", "Failed to get unread count: " + e.getMessage());
                        return ResponseEntity.badRequest().body(error);
                }
        }
}
