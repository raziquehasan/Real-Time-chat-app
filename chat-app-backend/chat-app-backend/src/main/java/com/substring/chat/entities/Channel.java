package com.substring.chat.entities;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Document(collection = "channels")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Channel {

    @Id
    private String id;

    private String name;
    private String description;
    private String avatarUrl;

    @Indexed
    private String ownerId;
    private String ownerName;

    private Set<String> adminIds = new HashSet<>(); // Additional admins

    private boolean isPrivate = false; // Public channels can be discovered

    private int subscriberCount = 0;

    // Channel settings
    private boolean commentsEnabled = true;
    private boolean reactionsEnabled = true;
    private boolean showViewCount = true;

    @Indexed
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
