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
import java.util.ArrayList;
import java.util.List;

@Document(collection = "groups")
@CompoundIndexes({
        @CompoundIndex(name = "owner_created", def = "{'ownerId': 1, 'createdAt': -1}")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Group {

    @Id
    private String id;

    private String name;
    private String description;
    private String avatarUrl;

    @Indexed
    private String ownerId;
    private String ownerName;

    private boolean isPrivate = false; // Public groups can be discovered

    @Indexed
    private String inviteLink; // Unique invite link token
    private boolean inviteLinkEnabled = true;

    private int memberCount = 1; // Starts with owner
    private int maxMembers = 256; // WhatsApp limit

    // Group settings
    private boolean onlyAdminsCanPost = false;
    private boolean onlyAdminsCanEditInfo = true;
    private boolean membersCanAddOthers = true;

    // Pinned messages
    private List<String> pinnedMessageIds = new ArrayList<>();

    @Indexed
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
