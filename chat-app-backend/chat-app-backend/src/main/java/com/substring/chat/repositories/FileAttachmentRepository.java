package com.substring.chat.repositories;

import com.substring.chat.entities.FileAttachment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileAttachmentRepository extends MongoRepository<FileAttachment, String> {
    List<FileAttachment> findByUploadedBy(String userId);
}
