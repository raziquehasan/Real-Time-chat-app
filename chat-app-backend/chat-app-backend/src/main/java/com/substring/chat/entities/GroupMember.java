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

@Document(collection = "group_members")
@CompoundIndexes({
        @CompoundIndex(name = "group_user", def = "{'groupId': 1, 'userId': 1}", unique = true),
        @CompoundIndex(name = "user_groups", def = "{'userId': 1, 'joinedAt': -1}")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GroupMember {

    @Id
    private String id;

    @Indexed
    private String groupId;

    @Indexed
    private String userId;
    private String userName;
    private String userAvatar;

    private GroupRole role = GroupRole.MEMBER;

    private boolean isMuted = false;
    private LocalDateTime mutedUntil;

    private LocalDateTime joinedAt;
    private LocalDateTime lastReadAt;

    private String addedBy; // Who added this member
}
