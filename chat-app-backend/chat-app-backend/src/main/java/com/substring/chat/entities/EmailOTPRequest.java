package com.substring.chat.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@RedisHash("EmailOTPRequest")
public class EmailOTPRequest {

    @Id
    private String email;

    private String otpCode;

    private LocalDateTime expiresAt;

    private int attempts = 0;

    @TimeToLive
    private Long timeToLive = 120L; // 2 minutes in seconds

    public EmailOTPRequest(String email, String otpCode) {
        this.email = email;
        this.otpCode = otpCode;
        this.expiresAt = LocalDateTime.now().plusMinutes(2);
        this.attempts = 0;
    }

    public void incrementAttempts() {
        this.attempts++;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiresAt);
    }

    public boolean hasExceededAttempts() {
        return this.attempts >= 3;
    }
}
