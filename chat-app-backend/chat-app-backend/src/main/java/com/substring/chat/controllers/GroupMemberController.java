package com.substring.chat.controllers;

import com.substring.chat.entities.GroupMember;
import com.substring.chat.entities.GroupRole;
import com.substring.chat.entities.User;
import com.substring.chat.repositories.UserRepository;
import com.substring.chat.services.GroupPermissionService;
import com.substring.chat.services.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups/{groupId}/members")
public class GroupMemberController {

    @Autowired
    private GroupService groupService;

    @Autowired
    private GroupPermissionService permissionService;

    @Autowired
    private UserRepository userRepository;

    /**
     * GET /api/groups/{groupId}/members - Get all group members
     */
    @GetMapping
    public ResponseEntity<?> getMembers(@PathVariable String groupId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate membership
        if (!groupService.validateMembership(groupId, user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not a member of this group"));
        }

        List<GroupMember> members = groupService.getGroupMembers(groupId);

        return ResponseEntity.ok(members);
    }

    /**
     * POST /api/groups/{groupId}/members - Add member to group
     */
    @PostMapping
    public ResponseEntity<?> addMember(
            @PathVariable String groupId,
            @RequestBody AddMemberRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate permission
        if (!permissionService.validatePermission(groupId, user.getId(), "ADD_MEMBER")) {
            return ResponseEntity.status(403).body(Map.of("error", "Insufficient permissions"));
        }

        try {
            // Get target user details
            User targetUser = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("Target user not found"));

            GroupMember member = groupService.addMember(
                    groupId,
                    targetUser.getId(),
                    targetUser.getName(),
                    targetUser.getProfilePicture(),
                    user.getId());

            return ResponseEntity.ok(member);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * DELETE /api/groups/{groupId}/members/{userId} - Remove member from group
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<?> removeMember(
            @PathVariable String groupId,
            @PathVariable String userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate permission
        if (!permissionService.validatePermission(groupId, user.getId(), "REMOVE_MEMBER")) {
            return ResponseEntity.status(403).body(Map.of("error", "Insufficient permissions"));
        }

        groupService.removeMember(groupId, userId);

        return ResponseEntity.ok(Map.of("message", "Member removed successfully"));
    }

    /**
     * PUT /api/groups/{groupId}/roles/{userId} - Update member role
     */
    @PutMapping("/{userId}/role")
    public ResponseEntity<?> updateRole(
            @PathVariable String groupId,
            @PathVariable String userId,
            @RequestBody UpdateRoleRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate permission (only owner can assign roles)
        if (!permissionService.validatePermission(groupId, user.getId(), "ASSIGN_ROLE")) {
            return ResponseEntity.status(403).body(Map.of("error", "Only owner can assign roles"));
        }

        GroupMember updated = groupService.assignRole(groupId, userId, request.getRole());

        return ResponseEntity.ok(updated);
    }

    // DTOs
    public static class AddMemberRequest {
        private String userId;

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }
    }

    public static class UpdateRoleRequest {
        private GroupRole role;

        public GroupRole getRole() {
            return role;
        }

        public void setRole(GroupRole role) {
            this.role = role;
        }
    }
}
