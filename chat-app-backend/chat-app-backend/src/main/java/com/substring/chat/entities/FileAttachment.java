package com.substring.chat.entities;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class FileAttachment {
    private String fileName;
    private String originalFileName;
    private String fileUrl;
    private String fileType; // image, pdf, document, other
    private long fileSize;
    private String thumbnailUrl; // for images

    public FileAttachment(String fileName, String originalFileName, String fileUrl, String fileType, long fileSize) {
        this.fileName = fileName;
        this.originalFileName = originalFileName;
        this.fileUrl = fileUrl;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.thumbnailUrl = null;
    }
}
