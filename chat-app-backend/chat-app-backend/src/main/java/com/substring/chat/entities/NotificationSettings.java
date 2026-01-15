package com.substring.chat.entities;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

@Document(collection = "notification_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettings {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    // Notification type toggles
    private boolean enableMessageNotifications = true;
    private boolean enableMentionNotifications = true;
    private boolean enableFileNotifications = true;
    private boolean enableGroupInviteNotifications = true;

    // Do Not Disturb
    private boolean dndEnabled = false;
    private LocalTime dndStartTime; // e.g., 22:00
    private LocalTime dndEndTime; // e.g., 08:00

    // Muted chats
    private Set<String> mutedChatIds = new HashSet<>();

    // Sound settings
    private boolean soundEnabled = true;

    private LocalDateTime updatedAt;

    // Helper method to check if currently in DND window
    public boolean isInDndWindow() {
        if (!dndEnabled || dndStartTime == null || dndEndTime == null) {
            return false;
        }

        LocalTime now = LocalTime.now();

        // Handle overnight DND (e.g., 22:00 to 08:00)
        if (dndStartTime.isAfter(dndEndTime)) {
            return now.isAfter(dndStartTime) || now.isBefore(dndEndTime);
        } else {
            // Same day DND (e.g., 14:00 to 18:00)
            return now.isAfter(dndStartTime) && now.isBefore(dndEndTime);
        }
    }
}
