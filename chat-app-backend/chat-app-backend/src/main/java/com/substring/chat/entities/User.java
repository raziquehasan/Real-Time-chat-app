package com.substring.chat.entities;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id;

    @TextIndexed
    private String name;

    @Indexed(unique = true)
    private String email;

    private String password; // BCrypt hashed

    private LocalDateTime createdAt;

    private LocalDateTime lastSeen;

    private boolean online;

    private String avatarUrl; // Optional: URL or base64

    private String about; // Bio/Status

    private String phone; // Phone number (optional)

    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.createdAt = LocalDateTime.now();
        this.lastSeen = LocalDateTime.now();
        this.online = false;
    }
}
