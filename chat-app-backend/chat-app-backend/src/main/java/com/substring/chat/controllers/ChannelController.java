package com.substring.chat.controllers;

import com.substring.chat.entities.Channel;
import com.substring.chat.entities.ChannelMessage;
import com.substring.chat.entities.User;
import com.substring.chat.repositories.ChannelMessageRepository;
import com.substring.chat.repositories.UserRepository;
import com.substring.chat.services.ChannelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/channels")
public class ChannelController {

    @Autowired
    private ChannelService channelService;

    @Autowired
    private ChannelMessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * POST /api/channels - Create new channel
     */
    @PostMapping
    public ResponseEntity<?> createChannel(@RequestBody CreateChannelRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Channel channel = channelService.createChannel(
                user.getId(),
                user.getName(),
                request.getName(),
                request.getDescription(),
                request.getAvatarUrl());

        return ResponseEntity.ok(channel);
    }

    /**
     * GET /api/channels/my - Get user's subscribed channels
     */
    @GetMapping("/my")
    public ResponseEntity<?> getMyChannels() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Channel> channels = channelService.getUserChannels(user.getId());

        return ResponseEntity.ok(channels);
    }

    /**
     * POST /api/channels/{id}/subscribe - Subscribe to channel
     */
    @PostMapping("/{id}/subscribe")
    public ResponseEntity<?> subscribe(@PathVariable String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        channelService.subscribe(id, user.getId());

        return ResponseEntity.ok(Map.of("message", "Subscribed successfully"));
    }

    /**
     * POST /api/channels/{id}/unsubscribe - Unsubscribe from channel
     */
    @PostMapping("/{id}/unsubscribe")
    public ResponseEntity<?> unsubscribe(@PathVariable String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        channelService.unsubscribe(id, user.getId());

        return ResponseEntity.ok(Map.of("message", "Unsubscribed successfully"));
    }

    /**
     * POST /api/channels/{id}/messages - Broadcast message (admin only)
     */
    @PostMapping("/{id}/messages")
    public ResponseEntity<?> broadcastMessage(
            @PathVariable String id,
            @RequestBody BroadcastMessageRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate admin permission
        if (!channelService.isChannelAdmin(id, user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admins can broadcast"));
        }

        ChannelMessage message = new ChannelMessage();
        message.setChannelId(id);
        message.setAuthorId(user.getId());
        message.setAuthorName(user.getName());
        message.setAuthorAvatar(user.getProfilePicture());
        message.setContent(request.getContent());
        message.setTimestamp(LocalDateTime.now());

        ChannelMessage saved = messageRepository.save(message);

        // Broadcast to all subscribers
        messagingTemplate.convertAndSend("/topic/channel/" + id, saved);

        return ResponseEntity.ok(saved);
    }

    /**
     * GET /api/channels/{id}/messages - Get channel messages
     */
    @GetMapping("/{id}/messages")
    public ResponseEntity<?> getMessages(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate subscription
        if (!channelService.isSubscribed(id, user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not subscribed to this channel"));
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<ChannelMessage> messages = messageRepository
                .findByChannelIdAndDeletedFalseOrderByTimestampDesc(id, pageable);

        return ResponseEntity.ok(messages);
    }

    // DTOs
    public static class CreateChannelRequest {
        private String name;
        private String description;
        private String avatarUrl;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getAvatarUrl() {
            return avatarUrl;
        }

        public void setAvatarUrl(String avatarUrl) {
            this.avatarUrl = avatarUrl;
        }
    }

    public static class BroadcastMessageRequest {
        private String content;

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }
}
