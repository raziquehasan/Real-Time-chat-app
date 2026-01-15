package com.substring.chat.controllers;

import com.substring.chat.entities.Notification;
import com.substring.chat.entities.NotificationSettings;
import com.substring.chat.entities.User;
import com.substring.chat.repositories.UserRepository;
import com.substring.chat.services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    /**
     * GET /api/notifications - Get all notifications with pagination
     */
    @GetMapping
    public ResponseEntity<?> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifications = notificationService.getNotifications(user.getId(), pageable);

        return ResponseEntity.ok(notifications);
    }

    /**
     * GET /api/notifications/unread-count - Get unread notification count
     */
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        long count = notificationService.getUnreadCount(user.getId());

        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * PUT /api/notifications/{id}/read - Mark notification as read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        notificationService.markAsRead(id, user.getId());

        return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
    }

    /**
     * PUT /api/notifications/mark-all-read - Mark all notifications as read
     */
    @PutMapping("/mark-all-read")
    public ResponseEntity<?> markAllAsRead() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        notificationService.markAllAsRead(user.getId());

        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    /**
     * DELETE /api/notifications - Clear all notifications
     */
    @DeleteMapping
    public ResponseEntity<?> clearAll() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        notificationService.clearAll(user.getId());

        return ResponseEntity.ok(Map.of("message", "All notifications cleared"));
    }

    /**
     * GET /api/notifications/settings - Get notification settings
     */
    @GetMapping("/settings")
    public ResponseEntity<?> getSettings() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        NotificationSettings settings = notificationService.getOrCreateSettings(user.getId());

        return ResponseEntity.ok(settings);
    }

    /**
     * PUT /api/notifications/settings - Update notification settings
     */
    @PutMapping("/settings")
    public ResponseEntity<?> updateSettings(@RequestBody NotificationSettings settings) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        NotificationSettings updated = notificationService.updateSettings(user.getId(), settings);

        return ResponseEntity.ok(updated);
    }
}
