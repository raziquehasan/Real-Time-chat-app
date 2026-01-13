package com.substring.chat.entities;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Message {

    private String messageId;
    private String sender;
    private String content;
    private LocalDateTime timeStamp;
    private MessageStatus status;
    private List<String> deliveredTo;
    private List<String> seenBy;
    private FileAttachment attachment; // NEW - for file/image sharing

    public Message(String sender, String content) {
        this.messageId = UUID.randomUUID().toString();
        this.sender = sender;
        this.content = content;
        this.timeStamp = LocalDateTime.now();
        this.status = MessageStatus.SENT;
        this.deliveredTo = new ArrayList<>();
        this.seenBy = new ArrayList<>();
    }
}

enum MessageStatus {
    SENT, DELIVERED, SEEN
}