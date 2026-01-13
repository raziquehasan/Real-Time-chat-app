package com.substring.chat.payload;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PrivateMessageRequest {
    private String senderId;
    private String senderName;
    private String receiverId;
    private String receiverName;
    private String content;
    private String fileUrl;
    private String fileType;
    private String fileName;
}
