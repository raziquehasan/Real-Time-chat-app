package com.substring.chat.dto;

import com.substring.chat.entities.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private User user;
    private String message;

    public AuthResponse(String token, User user) {
        this.token = token;
        this.user = user;
    }
}
