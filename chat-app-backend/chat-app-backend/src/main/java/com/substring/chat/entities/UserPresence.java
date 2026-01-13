package com.substring.chat.entities;

import java.time.LocalDateTime;

public class UserPresence {
    private String userId;
    private String userName;
    private String roomId;
    private LocalDateTime joinedAt;
    private boolean online;

    public UserPresence() {
    }

    public UserPresence(String userId, String userName, String roomId) {
        this.userId = userId;
        this.userName = userName;
        this.roomId = roomId;
        this.joinedAt = LocalDateTime.now();
        this.online = true;
    }

    // Getters and Setters
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }

    public boolean isOnline() {
        return online;
    }

    public void setOnline(boolean online) {
        this.online = online;
    }
}
