package com.substring.chat.playload;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class MessageStatusUpdate {
    private String messageId;
    private String userId;
    private String userName;
    private String status; // DELIVERED or SEEN
    private String roomId;
}
