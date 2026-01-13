package com.substring.chat.payload;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TypingNotification {
    private String userId;
    private String userName;
    private String receiverId;
    private boolean typing;
}
