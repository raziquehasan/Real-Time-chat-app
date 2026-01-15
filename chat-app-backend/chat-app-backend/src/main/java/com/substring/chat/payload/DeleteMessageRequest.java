package com.substring.chat.payload;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DeleteMessageRequest {
    private String messageId;
    private String deleteType; // "FOR_ME" or "FOR_EVERYONE"
}
