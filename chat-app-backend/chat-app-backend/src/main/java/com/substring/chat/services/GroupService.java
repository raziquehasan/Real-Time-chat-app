package com.substring.chat.services;

import com.substring.chat.entities.Group;
import com.substring.chat.entities.GroupMember;
import com.substring.chat.entities.GroupRole;
import com.substring.chat.repositories.GroupMemberRepository;
import com.substring.chat.repositories.GroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupMemberRepository memberRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Create new group
     */
    @Transactional
    public Group createGroup(String ownerId, String ownerName, String name, String description, String avatarUrl) {
        Group group = new Group();
        group.setName(name);
        group.setDescription(description);
        group.setAvatarUrl(avatarUrl);
        group.setOwnerId(ownerId);
        group.setOwnerName(ownerName);
        group.setInviteLink(generateUniqueInviteLink());
        group.setCreatedAt(LocalDateTime.now());
        group.setUpdatedAt(LocalDateTime.now());
        group.setMemberCount(1);

        Group saved = groupRepository.save(group);

        // Add owner as member
        GroupMember owner = new GroupMember();
        owner.setGroupId(saved.getId());
        owner.setUserId(ownerId);
        owner.setUserName(ownerName);
        owner.setRole(GroupRole.OWNER);
        owner.setJoinedAt(LocalDateTime.now());
        owner.setLastReadAt(LocalDateTime.now());
        memberRepository.save(owner);

        return saved;
    }

    /**
     * Update group details
     */
    public Group updateGroup(String groupId, String name, String description, String avatarUrl) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        if (name != null)
            group.setName(name);
        if (description != null)
            group.setDescription(description);
        if (avatarUrl != null)
            group.setAvatarUrl(avatarUrl);
        group.setUpdatedAt(LocalDateTime.now());

        return groupRepository.save(group);
    }

    /**
     * Delete group
     */
    @Transactional
    public void deleteGroup(String groupId) {
        groupRepository.deleteById(groupId);
        // Delete all members
        List<GroupMember> members = memberRepository.findByGroupIdOrderByJoinedAtAsc(groupId);
        memberRepository.deleteAll(members);
    }

    /**
     * Add member to group
     */
    @Transactional
    public GroupMember addMember(String groupId, String userId, String userName, String userAvatar, String addedBy) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        // Check if already member
        if (memberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new IllegalStateException("User already in group");
        }

        // Check max members
        if (group.getMemberCount() >= group.getMaxMembers()) {
            throw new IllegalStateException("Group is full (max " + group.getMaxMembers() + " members)");
        }

        GroupMember member = new GroupMember();
        member.setGroupId(groupId);
        member.setUserId(userId);
        member.setUserName(userName);
        member.setUserAvatar(userAvatar);
        member.setRole(GroupRole.MEMBER);
        member.setAddedBy(addedBy);
        member.setJoinedAt(LocalDateTime.now());
        member.setLastReadAt(LocalDateTime.now());

        GroupMember saved = memberRepository.save(member);

        // Update member count
        group.setMemberCount(group.getMemberCount() + 1);
        groupRepository.save(group);

        // Broadcast member joined event
        Map<String, Object> event = new HashMap<>();
        event.put("type", "MEMBER_JOINED");
        event.put("member", saved);
        messagingTemplate.convertAndSend("/topic/group/" + groupId + "/events", event);

        return saved;
    }

    /**
     * Remove member from group
     */
    @Transactional
    public void removeMember(String groupId, String userId) {
        memberRepository.deleteByGroupIdAndUserId(groupId, userId);

        // Update member count
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        group.setMemberCount(Math.max(0, group.getMemberCount() - 1));
        groupRepository.save(group);

        // Broadcast member left event
        Map<String, Object> event = new HashMap<>();
        event.put("type", "MEMBER_LEFT");
        event.put("userId", userId);
        messagingTemplate.convertAndSend("/topic/group/" + groupId + "/events", event);
    }

    /**
     * Assign role to member
     */
    public GroupMember assignRole(String groupId, String userId, GroupRole newRole) {
        GroupMember member = memberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        member.setRole(newRole);
        GroupMember updated = memberRepository.save(member);

        // Broadcast role update
        Map<String, Object> event = new HashMap<>();
        event.put("type", "ROLE_UPDATED");
        event.put("userId", userId);
        event.put("role", newRole);
        messagingTemplate.convertAndSend("/topic/group/" + groupId + "/events", event);

        return updated;
    }

    /**
     * Generate unique invite link
     */
    private String generateUniqueInviteLink() {
        String token;
        do {
            token = UUID.randomUUID().toString().substring(0, 8);
        } while (groupRepository.findByInviteLink(token).isPresent());
        return token;
    }

    /**
     * Join group via invite link
     */
    @Transactional
    public Group joinViaInvite(String inviteToken, String userId, String userName, String userAvatar) {
        Group group = groupRepository.findByInviteLink(inviteToken)
                .orElseThrow(() -> new RuntimeException("Invalid invite link"));

        if (!group.isInviteLinkEnabled()) {
            throw new IllegalStateException("Invite link is disabled");
        }

        addMember(group.getId(), userId, userName, userAvatar, "invite_link");

        return group;
    }

    /**
     * Get user's groups
     */
    public List<Group> getUserGroups(String userId) {
        List<GroupMember> memberships = memberRepository.findByUserIdOrderByJoinedAtDesc(userId);
        List<String> groupIds = memberships.stream()
                .map(GroupMember::getGroupId)
                .collect(Collectors.toList());

        return groupRepository.findAllById(groupIds);
    }

    /**
     * Get group members
     */
    public List<GroupMember> getGroupMembers(String groupId) {
        return memberRepository.findByGroupIdOrderByJoinedAtAsc(groupId);
    }

    /**
     * Validate membership
     */
    public boolean validateMembership(String groupId, String userId) {
        return memberRepository.existsByGroupIdAndUserId(groupId, userId);
    }

    /**
     * Get member role
     */
    public GroupRole getMemberRole(String groupId, String userId) {
        return memberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(GroupMember::getRole)
                .orElse(null);
    }
}
