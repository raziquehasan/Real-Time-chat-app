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
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Document(collection = "channel_messages")
@CompoundIndexes({
        @CompoundIndex(name = "channel_timestamp", def = "{'channelId': 1, 'timestamp': -1}")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChannelMessage {

    @Id
    private String id;

    @Indexed
    private String channelId;

    private String authorId;
    private String authorName;
    private String authorAvatar;

    private String content;

    // File attachments
    private String fileUrl;
    private String fileType;
    private String fileName;

    // Reactions
    private Map<String, String> reactions = new HashMap<>(); // userId -> emoji

    // View tracking
    private int viewCount = 0;
    private Set<String> viewedBy = new HashSet<>();

    // Comments
    private boolean commentsEnabled = true;
    private int commentCount = 0;

    @Indexed
    private LocalDateTime timestamp;

    private boolean deleted = false;
    private LocalDateTime deletedAt;
}
