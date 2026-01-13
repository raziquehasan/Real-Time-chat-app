package com.substring.chat.payload;

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
    private String email;
    private String name;
    private String userId;
    private String message;

    public AuthResponse(String token, String email, String name, String userId) {
        this.token = token;
        this.email = email;
        this.name = name;
        this.userId = userId;
    }
}
