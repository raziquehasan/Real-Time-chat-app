package com.substring.chat.controllers;

import com.substring.chat.entities.User;
import com.substring.chat.payload.UserResponse;
import com.substring.chat.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.substring.chat.services.FileStorageService fileStorageService;

    /**
     * Get all users (excluding current user)
     * GET /api/users
     */
    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = authentication.getName();

            // Get all users except current user
            List<User> allUsers = userRepository.findAll();

            List<UserResponse> users = allUsers.stream()
                    .filter(user -> !user.getEmail().equals(currentUserEmail))
                    .map(user -> new UserResponse(
                            user.getId(),
                            user.getName(),
                            user.getEmail(),
                            user.getCreatedAt(),
                            user.getLastSeen(),
                            user.isOnline(),
                            user.getAvatarUrl(),
                            user.getAbout(),
                            user.getPhone()))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(users);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to get users: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Get user by ID
     * GET /api/users/{userId}
     */
    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserById(@PathVariable String userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            UserResponse response = new UserResponse(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getCreatedAt(),
                    user.getLastSeen(),
                    user.isOnline(),
                    user.getAvatarUrl(),
                    user.getAbout(),
                    user.getPhone());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to get user: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Search users by name or email
     * GET /api/users/search?q=query
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestParam String q) {
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = authentication.getName();

            // Get all users and filter by query
            List<User> allUsers = userRepository.findAll();

            List<UserResponse> users = allUsers.stream()
                    .filter(user -> !user.getEmail().equals(currentUserEmail))
                    .filter(user -> user.getName().toLowerCase().contains(q.toLowerCase()) ||
                            user.getEmail().toLowerCase().contains(q.toLowerCase()))
                    .map(user -> new UserResponse(
                            user.getId(),
                            user.getName(),
                            user.getEmail(),
                            user.getCreatedAt(),
                            user.getLastSeen(),
                            user.isOnline(),
                            user.getAvatarUrl(),
                            user.getAbout(),
                            user.getPhone()))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(users);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to search users: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Update current user profile
     * PUT /api/users/profile
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody com.substring.chat.payload.UserUpdateRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (request.getName() != null)
                user.setName(request.getName());
            if (request.getAbout() != null)
                user.setAbout(request.getAbout());
            if (request.getPhone() != null)
                user.setPhone(request.getPhone());
            if (request.getAvatarUrl() != null)
                user.setAvatarUrl(request.getAvatarUrl());

            User savedUser = userRepository.save(user);

            UserResponse response = new UserResponse(
                    savedUser.getId(),
                    savedUser.getName(),
                    savedUser.getEmail(),
                    savedUser.getCreatedAt(),
                    savedUser.getLastSeen(),
                    savedUser.isOnline(),
                    savedUser.getAvatarUrl(),
                    savedUser.getAbout(),
                    savedUser.getPhone());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to update profile: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Upload avatar image
     * POST /api/users/upload-avatar
     */
    @PostMapping("/upload-avatar")
    public ResponseEntity<?> uploadAvatar(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Upload to Cloudinary using FileStorageService
            com.substring.chat.entities.FileAttachment attachment = fileStorageService.uploadFile(file, user.getId());

            // Save avatar URL
            user.setAvatarUrl(attachment.getFileUrl());
            User savedUser = userRepository.save(user);

            UserResponse response = new UserResponse(
                    savedUser.getId(),
                    savedUser.getName(),
                    savedUser.getEmail(),
                    savedUser.getCreatedAt(),
                    savedUser.getLastSeen(),
                    savedUser.isOnline(),
                    savedUser.getAvatarUrl(),
                    savedUser.getAbout(),
                    savedUser.getPhone());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to upload avatar: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
