package com.substring.chat.services;

import com.substring.chat.entities.GroupRole;
import com.substring.chat.repositories.GroupMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class GroupPermissionService {

    @Autowired
    private GroupMemberRepository memberRepository;

    /**
     * Validate if user has permission to perform action
     */
    public boolean validatePermission(String groupId, String userId, String action) {
        GroupRole role = memberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(member -> member.getRole())
                .orElse(null);

        if (role == null) {
            return false; // Not a member
        }

        return switch (action) {
            case "SEND_MESSAGE" -> canSendMessage(role);
            case "ADD_MEMBER" -> canAddMember(role);
            case "REMOVE_MEMBER" -> canRemoveMember(role);
            case "EDIT_GROUP" -> canEditGroup(role);
            case "DELETE_GROUP" -> canDeleteGroup(role);
            case "ASSIGN_ROLE" -> canAssignRole(role);
            case "PIN_MESSAGE" -> canPinMessage(role);
            case "DELETE_MESSAGE" -> canDeleteMessage(role);
            case "CREATE_POLL" -> canCreatePoll(role);
            default -> false;
        };
    }

    private boolean canSendMessage(GroupRole role) {
        return true; // All members can send messages (can be customized per group)
    }

    private boolean canAddMember(GroupRole role) {
        return role == GroupRole.OWNER || role == GroupRole.ADMIN;
    }

    private boolean canRemoveMember(GroupRole role) {
        return role == GroupRole.OWNER || role == GroupRole.ADMIN;
    }

    private boolean canEditGroup(GroupRole role) {
        return role == GroupRole.OWNER || role == GroupRole.ADMIN;
    }

    private boolean canDeleteGroup(GroupRole role) {
        return role == GroupRole.OWNER;
    }

    private boolean canAssignRole(GroupRole role) {
        return role == GroupRole.OWNER;
    }

    private boolean canPinMessage(GroupRole role) {
        return role == GroupRole.OWNER || role == GroupRole.ADMIN || role == GroupRole.MODERATOR;
    }

    private boolean canDeleteMessage(GroupRole role) {
        return role == GroupRole.OWNER || role == GroupRole.ADMIN || role == GroupRole.MODERATOR;
    }

    private boolean canCreatePoll(GroupRole role) {
        return true; // All members can create polls
    }

    /**
     * Check if user is at least a moderator
     */
    public boolean isModerator(String groupId, String userId) {
        GroupRole role = memberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(member -> member.getRole())
                .orElse(null);

        return role == GroupRole.OWNER || role == GroupRole.ADMIN || role == GroupRole.MODERATOR;
    }

    /**
     * Check if user is admin or owner
     */
    public boolean isAdmin(String groupId, String userId) {
        GroupRole role = memberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(member -> member.getRole())
                .orElse(null);

        return role == GroupRole.OWNER || role == GroupRole.ADMIN;
    }

    /**
     * Check if user is owner
     */
    public boolean isOwner(String groupId, String userId) {
        GroupRole role = memberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(member -> member.getRole())
                .orElse(null);

        return role == GroupRole.OWNER;
    }
}
