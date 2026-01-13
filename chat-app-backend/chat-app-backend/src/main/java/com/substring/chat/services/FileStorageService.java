package com.substring.chat.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.substring.chat.entities.FileAttachment;
import com.substring.chat.repositories.FileAttachmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class FileStorageService {

    @Autowired
    private Cloudinary cloudinary;

    @Autowired
    private FileAttachmentRepository fileAttachmentRepository;

    /**
     * Upload file to Cloudinary
     */
    public FileAttachment uploadFile(MultipartFile file, String userId) throws IOException {
        // Upload to Cloudinary
        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap("resource_type", "auto"));

        String fileUrl = (String) uploadResult.get("secure_url");
        String publicId = (String) uploadResult.get("public_id");
        String fileType = (String) uploadResult.get("resource_type");
        long fileSize = file.getSize();
        String originalFileName = file.getOriginalFilename();

        // Create metadata
        FileAttachment attachment = new FileAttachment(
                originalFileName,
                originalFileName,
                fileUrl,
                fileType,
                fileSize,
                publicId,
                userId);

        // Save to database
        return fileAttachmentRepository.save(attachment);
    }

    /**
     * Delete file from Cloudinary and DB
     */
    public void deleteFile(String attachmentId) throws IOException {
        FileAttachment attachment = fileAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        // Delete from Cloudinary
        cloudinary.uploader().destroy(attachment.getPublicId(), ObjectUtils.emptyMap());

        // Delete from DB
        fileAttachmentRepository.deleteById(attachmentId);
    }
}
