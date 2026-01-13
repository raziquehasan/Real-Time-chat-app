package com.substring.chat.controllers;

import com.substring.chat.entities.FileAttachment;
import com.substring.chat.entities.User;
import com.substring.chat.repositories.UserRepository;
import com.substring.chat.services.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "http://localhost:*")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Upload a file
     * POST /api/files/upload
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            // Get current user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Upload file
            FileAttachment attachment = fileStorageService.uploadFile(file, user.getId());

            return ResponseEntity.ok(attachment);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Upload failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Delete a file
     * DELETE /api/files/{attachmentId}
     */
    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<?> deleteFile(@PathVariable String attachmentId) {
        try {
            fileStorageService.deleteFile(attachmentId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "File deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Deletion failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
