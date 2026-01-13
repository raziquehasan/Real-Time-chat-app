package com.substring.chat.entities;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "file_attachments")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class FileAttachment {
    @Id
    private String id;
    private String fileName;
    private String originalFileName;
    private String fileUrl;
    private String fileType; // image, pdf, document, other
    private long fileSize;
    private String publicId; // Cloudinary public ID
    private String uploadedBy; // userId
    private LocalDateTime uploadedAt;

    public FileAttachment(String fileName, String originalFileName, String fileUrl, String fileType, long fileSize,
            String publicId, String uploadedBy) {
        this.fileName = fileName;
        this.originalFileName = originalFileName;
        this.fileUrl = fileUrl;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.publicId = publicId;
        this.uploadedBy = uploadedBy;
        this.uploadedAt = LocalDateTime.now();
    }
}
