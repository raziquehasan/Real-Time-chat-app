package com.substring.chat.entities;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@CompoundIndexes({
        @CompoundIndex(name = "user_read_created", def = "{'userId': 1, 'isRead': 1, 'createdAt': -1}")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    private String id;

    @Indexed
    private String userId; // Recipient user ID

    private String senderId; // Who triggered this notification
    private String senderName;
    private String senderAvatar;

    private String chatId; // Related chat/group ID
    private String messageId; // Related message ID

    private NotificationType type; // MESSAGE, MENTION, FILE, GROUP_INVITE

    private String title; // "New message from John"
    private String body; // Message preview or description

    private String actionUrl; // Navigation URL (e.g., "/chat/user123")

    @Indexed
    private boolean isRead = false;
    private LocalDateTime readAt;

    @Indexed
    private LocalDateTime createdAt;

    public enum NotificationType {
        MESSAGE,
        MENTION,
        FILE,
        GROUP_INVITE
    }
}
