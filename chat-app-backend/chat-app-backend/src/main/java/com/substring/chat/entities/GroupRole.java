package com.substring.chat.entities;

public enum GroupRole {
    OWNER, // Full control - can delete group, assign admins
    ADMIN, // Can manage members, edit group info, delete messages
    MODERATOR, // Can delete messages, mute members
    MEMBER // Regular member - can send messages
}
