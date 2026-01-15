package com.substring.chat.services;

import com.substring.chat.entities.Notification;
import com.substring.chat.entities.Notification.NotificationType;
import com.substring.chat.entities.NotificationSettings;
import com.substring.chat.repositories.NotificationRepository;
import com.substring.chat.repositories.NotificationSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationSettingsRepository settingsRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Create and send notification
     */
    public Notification createNotification(
            String senderId,
            String senderName,
            String senderAvatar,
            String receiverId,
            String chatId,
            String messageId,
            NotificationType type,
            String title,
            String body,
            String actionUrl) {
        // Check if should notify based on user settings
        if (!shouldNotify(receiverId, chatId, type)) {
            return null;
        }

        Notification notification = new Notification();
        notification.setUserId(receiverId);
        notification.setSenderId(senderId);
        notification.setSenderName(senderName);
        notification.setSenderAvatar(senderAvatar);
        notification.setChatId(chatId);
        notification.setMessageId(messageId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setActionUrl(actionUrl);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        Notification saved = notificationRepository.save(notification);

        // Send real-time notification via WebSocket
        sendWebSocketNotification(saved);

        return saved;
    }

    /**
     * Check if should notify based on user settings
     */
    public boolean shouldNotify(String userId, String chatId, NotificationType type) {
        NotificationSettings settings = getOrCreateSettings(userId);

        // Check DND mode
        if (settings.isDndEnabled() && settings.isInDndWindow()) {
            return false;
        }

        // Check if chat is muted
        if (chatId != null && settings.getMutedChatIds().contains(chatId)) {
            return false;
        }

        // Check notification type settings
        switch (type) {
            case MESSAGE:
                return settings.isEnableMessageNotifications();
            case MENTION:
                return settings.isEnableMentionNotifications();
            case FILE:
                return settings.isEnableFileNotifications();
            case GROUP_INVITE:
                return settings.isEnableGroupInviteNotifications();
            default:
                return true;
        }
    }

    /**
     * Get or create default settings for user
     */
    public NotificationSettings getOrCreateSettings(String userId) {
        return settingsRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultSettings(userId));
    }

    /**
     * Create default notification settings
     */
    private NotificationSettings createDefaultSettings(String userId) {
        NotificationSettings settings = new NotificationSettings();
        settings.setUserId(userId);
        settings.setEnableMessageNotifications(true);
        settings.setEnableMentionNotifications(true);
        settings.setEnableFileNotifications(true);
        settings.setEnableGroupInviteNotifications(true);
        settings.setDndEnabled(false);
        settings.setSoundEnabled(true);
        settings.setUpdatedAt(LocalDateTime.now());
        return settingsRepository.save(settings);
    }

    /**
     * Mark notification as read
     */
    public void markAsRead(String notificationId, String userId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            if (notification.getUserId().equals(userId) && !notification.isRead()) {
                notification.setRead(true);
                notification.setReadAt(LocalDateTime.now());
                notificationRepository.save(notification);

                // Send WebSocket event for read status
                Map<String, Object> event = new HashMap<>();
                event.put("type", "notification:read");
                event.put("notificationId", notificationId);
                messagingTemplate.convertAndSendToUser(
                        userId,
                        "/queue/notification-events",
                        event);
            }
        });
    }

    /**
     * Mark all notifications as read for user
     */
    @Transactional
    public void markAllAsRead(String userId) {
        List<Notification> unreadNotifications = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);

        LocalDateTime now = LocalDateTime.now();
        unreadNotifications.forEach(notification -> {
            notification.setRead(true);
            notification.setReadAt(now);
        });

        notificationRepository.saveAll(unreadNotifications);

        // Send WebSocket event
        Map<String, Object> event = new HashMap<>();
        event.put("type", "notification:mark-all-read");
        event.put("count", unreadNotifications.size());
        messagingTemplate.convertAndSendToUser(
                userId,
                "/queue/notification-events",
                event);
    }

    /**
     * Clear all notifications for user
     */
    @Transactional
    public void clearAll(String userId) {
        notificationRepository.deleteByUserId(userId);

        // Send WebSocket event
        Map<String, Object> event = new HashMap<>();
        event.put("type", "notification:clear-all");
        messagingTemplate.convertAndSendToUser(
                userId,
                "/queue/notification-events",
                event);
    }

    /**
     * Get unread count for user
     */
    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Get notifications for user with pagination
     */
    public Page<Notification> getNotifications(String userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    /**
     * Update notification settings
     */
    public NotificationSettings updateSettings(String userId, NotificationSettings settings) {
        settings.setUserId(userId);
        settings.setUpdatedAt(LocalDateTime.now());
        return settingsRepository.save(settings);
    }

    /**
     * Send WebSocket notification to user
     */
    private void sendWebSocketNotification(Notification notification) {
        Map<String, Object> event = new HashMap<>();
        event.put("type", "notification:new");
        event.put("notification", notification);

        messagingTemplate.convertAndSendToUser(
                notification.getUserId(),
                "/queue/notifications",
                event);
    }
}
