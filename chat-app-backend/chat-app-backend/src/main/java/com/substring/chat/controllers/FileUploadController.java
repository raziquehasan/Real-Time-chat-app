package com.substring.chat.controllers;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
@CrossOrigin(origins = { "http://localhost:*", "http://127.0.0.1:*" })
public class FileUploadController {

    private final String UPLOAD_DIR = "uploads/";
    private final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    public FileUploadController() {
        // Create upload directory if it doesn't exist
        try {
            Files.createDirectories(Paths.get(UPLOAD_DIR));
            Files.createDirectories(Paths.get(UPLOAD_DIR + "images/"));
            Files.createDirectories(Paths.get(UPLOAD_DIR + "documents/"));
            Files.createDirectories(Paths.get(UPLOAD_DIR + "other/"));
        } catch (IOException e) {
            System.err.println("Could not create upload directories: " + e.getMessage());
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("roomId") String roomId,
            @RequestParam("sender") String sender) {
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }

            if (file.getSize() > MAX_FILE_SIZE) {
                return ResponseEntity.badRequest().body("File size exceeds 10MB limit");
            }

            // Get file info
            String originalFilename = file.getOriginalFilename();
            String contentType = file.getContentType();

            // Determine file type and directory
            String fileType = determineFileType(contentType);
            String subDir = fileType + "s/";

            // Generate unique filename
            String fileExtension = getFileExtension(originalFilename);
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

            // Save file
            Path uploadPath = Paths.get(UPLOAD_DIR + subDir + uniqueFilename);
            Files.copy(file.getInputStream(), uploadPath, StandardCopyOption.REPLACE_EXISTING);

            System.out.println("📎 File uploaded: " + originalFilename + " by " + sender);
            System.out.println("💾 Saved as: " + uniqueFilename + " (" + formatFileSize(file.getSize()) + ")");

            // Create response
            Map<String, Object> response = new HashMap<>();
            response.put("fileName", uniqueFilename);
            response.put("originalFileName", originalFilename);
            response.put("fileUrl", "/api/v1/files/download/" + uniqueFilename);
            response.put("fileType", fileType);
            response.put("fileSize", file.getSize());
            response.put("uploadedBy", sender);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            System.err.println("❌ File upload error: " + e.getMessage());
            return ResponseEntity.internalServerError().body("File upload failed: " + e.getMessage());
        }
    }

    @GetMapping("/download/{filename}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) {
        try {
            // Search in all subdirectories
            Path filePath = findFile(filename);

            if (filePath == null) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            System.err.println("❌ File download error: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    private Path findFile(String filename) throws IOException {
        String[] subdirs = { "images/", "documents/", "other/" };

        for (String subdir : subdirs) {
            Path path = Paths.get(UPLOAD_DIR + subdir + filename);
            if (Files.exists(path)) {
                return path;
            }
        }

        return null;
    }

    private String determineFileType(String contentType) {
        if (contentType == null)
            return "other";

        if (contentType.startsWith("image/")) {
            return "image";
        } else if (contentType.equals("application/pdf") ||
                contentType.contains("document") ||
                contentType.contains("text")) {
            return "document";
        } else {
            return "other";
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null)
            return "";
        int lastDot = filename.lastIndexOf('.');
        return (lastDot == -1) ? "" : filename.substring(lastDot);
    }

    private String formatFileSize(long size) {
        if (size < 1024)
            return size + " B";
        if (size < 1024 * 1024)
            return String.format("%.2f KB", size / 1024.0);
        return String.format("%.2f MB", size / (1024.0 * 1024.0));
    }
}
