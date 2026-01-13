package com.substring.chat.entities;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class MessageReaction {
    private String messageId;
    private String userId;
    private String userName;
    private String emoji;
    private LocalDateTime timestamp;

    public MessageReaction(String messageId, String userId, String userName, String emoji) {
        this.messageId = messageId;
        this.userId = userId;
        this.userName = userName;
        this.emoji = emoji;
        this.timestamp = LocalDateTime.now();
    }
}
