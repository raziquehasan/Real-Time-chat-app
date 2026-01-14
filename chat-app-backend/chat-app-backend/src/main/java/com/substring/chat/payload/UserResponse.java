package com.substring.chat.payload;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private String id;
    private String name;
    private String email;
    private LocalDateTime createdAt;
    private LocalDateTime lastSeen;
    private boolean online;
    private String avatarUrl;
    private String about;
    private String phone;
}
