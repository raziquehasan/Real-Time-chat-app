package com.substring.chat.controllers;

import com.substring.chat.entities.Group;
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
@RequestMapping("/api/groups")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @Autowired
    private GroupPermissionService permissionService;

    @Autowired
    private UserRepository userRepository;

    /**
     * POST /api/groups - Create new group
     */
    @PostMapping
    public ResponseEntity<?> createGroup(@RequestBody CreateGroupRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Group group = groupService.createGroup(
                user.getId(),
                user.getName(),
                request.getName(),
                request.getDescription(),
                request.getAvatarUrl());

        return ResponseEntity.ok(group);
    }

    /**
     * GET /api/groups/my - Get user's groups
     */
    @GetMapping("/my")
    public ResponseEntity<?> getMyGroups() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Group> groups = groupService.getUserGroups(user.getId());

        return ResponseEntity.ok(groups);
    }

    /**
     * GET /api/groups/{id} - Get group details
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getGroup(@PathVariable String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate membership
        if (!groupService.validateMembership(id, user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not a member of this group"));
        }

        Group group = groupService.getUserGroups(user.getId()).stream()
                .filter(g -> g.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Group not found"));

        return ResponseEntity.ok(group);
    }

    /**
     * PUT /api/groups/{id} - Update group
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateGroup(
            @PathVariable String id,
            @RequestBody UpdateGroupRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate permission
        if (!permissionService.validatePermission(id, user.getId(), "EDIT_GROUP")) {
            return ResponseEntity.status(403).body(Map.of("error", "Insufficient permissions"));
        }

        Group updated = groupService.updateGroup(
                id,
                request.getName(),
                request.getDescription(),
                request.getAvatarUrl());

        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/groups/{id} - Delete group
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGroup(@PathVariable String id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate permission (only owner can delete)
        if (!permissionService.validatePermission(id, user.getId(), "DELETE_GROUP")) {
            return ResponseEntity.status(403).body(Map.of("error", "Only owner can delete group"));
        }

        groupService.deleteGroup(id);

        return ResponseEntity.ok(Map.of("message", "Group deleted successfully"));
    }

    /**
     * POST /api/groups/join/{inviteLink} - Join group via invite link
     */
    @PostMapping("/join/{inviteLink}")
    public ResponseEntity<?> joinViaInvite(@PathVariable String inviteLink) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        try {
            Group group = groupService.joinViaInvite(
                    inviteLink,
                    user.getId(),
                    user.getName(),
                    user.getAvatarUrl());

            return ResponseEntity.ok(group);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    // DTOs
    public static class CreateGroupRequest {
        private String name;
        private String description;
        private String avatarUrl;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getAvatarUrl() {
            return avatarUrl;
        }

        public void setAvatarUrl(String avatarUrl) {
            this.avatarUrl = avatarUrl;
        }
    }

    public static class UpdateGroupRequest {
        private String name;
        private String description;
        private String avatarUrl;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getAvatarUrl() {
            return avatarUrl;
        }

        public void setAvatarUrl(String avatarUrl) {
            this.avatarUrl = avatarUrl;
        }
    }
}
