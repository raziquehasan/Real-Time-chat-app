package com.substring.chat.entities;

import com.fasterxml.jackson.annotation.JsonProperty;
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
import java.util.HashMap;
import java.util.Map;

@Document(collection = "private_messages")
@CompoundIndexes({
        @CompoundIndex(name = "chat_history", def = "{'senderId': 1, 'receiverId': 1, 'timestamp': -1}")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PrivateMessage {

    @Id
    private String id;

    @Indexed
    private String senderId;
    private String senderName;
    @Indexed
    private String receiverId;
    private String receiverName;

    private String content;
    @Indexed
    private LocalDateTime timestamp;

    @JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime readAt;

    @JsonProperty("isDelivered")
    private boolean isDelivered;
    private LocalDateTime deliveredAt;

    // For file attachments
    private String fileUrl;
    private String fileType;
    private String fileName;

    private Map<String, String> reactions = new HashMap<>(); // userId -> emoji

    private ReplyDetails replyTo;

    public PrivateMessage(String senderId, String senderName, String receiverId, String receiverName, String content) {
        this.senderId = senderId;
        this.senderName = senderName;
        this.receiverId = receiverId;
        this.receiverName = receiverName;
        this.content = content;
        this.timestamp = LocalDateTime.now();
        this.isRead = false;
        this.isDelivered = true;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReplyDetails {
        private String messageId;
        private String content;
        private String senderName;
    }
}
