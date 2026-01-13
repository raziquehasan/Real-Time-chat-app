package com.substring.chat.entities;

import java.time.LocalDateTime;

public class TypingNotification {
    private String roomId;
    private String userName;
    private boolean isTyping;
    private LocalDateTime timestamp;

    public TypingNotification() {
    }

    public TypingNotification(String roomId, String userName, boolean isTyping) {
        this.roomId = roomId;
        this.userName = userName;
        this.isTyping = isTyping;
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public boolean isTyping() {
        return isTyping;
    }

    public void setTyping(boolean typing) {
        isTyping = typing;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
