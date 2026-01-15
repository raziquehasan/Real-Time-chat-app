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
import java.util.*;

@Document(collection = "group_messages")
@CompoundIndexes({
        @CompoundIndex(name = "group_timestamp", def = "{'groupId': 1, 'timestamp': -1}")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GroupMessage {

    @Id
    private String id;

    @Indexed
    private String groupId;

    private String senderId;
    private String senderName;
    private String senderAvatar;

    private String content;

    // File attachments
    private String fileUrl;
    private String fileType;
    private String fileName;

    // Mentions (@username)
    private List<String> mentionedUserIds = new ArrayList<>();

    // Reply thread
    private ReplyDetails replyTo;

    // Poll
    private PollData poll;

    // Forwarded
    private String forwardedFromId;
    private String forwardedFromName;

    // Reactions
    private Map<String, String> reactions = new HashMap<>(); // userId -> emoji

    // Read receipts
    private Set<String> readBy = new HashSet<>();

    private boolean isPinned = false;

    @Indexed
    private LocalDateTime timestamp;

    private boolean deletedForEveryone = false;
    private LocalDateTime deletedAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReplyDetails {
        private String messageId;
        private String content;
        private String senderName;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PollData {
        private String question;
        private List<PollOption> options;
        private boolean multipleChoice = false;
        private LocalDateTime expiresAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PollOption {
        private String id;
        private String text;
        private Set<String> voterIds = new HashSet<>();
    }
}
