package com.substring.chat.entities;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;

import java.time.LocalDateTime;

@RedisHash("OTPRequest")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OTPRequest {

    @Id
    private String phoneNumber; // Primary key

    private String otpCode; // 6-digit OTP

    private LocalDateTime expiresAt; // Expiry timestamp

    private int attempts; // Number of verification attempts

    @TimeToLive
    private Long ttl; // Time to live in seconds (120 seconds = 2 minutes)

    public OTPRequest(String phoneNumber, String otpCode) {
        this.phoneNumber = phoneNumber;
        this.otpCode = otpCode;
        this.expiresAt = LocalDateTime.now().plusMinutes(2);
        this.attempts = 0;
        this.ttl = 120L; // 2 minutes
    }

    public void incrementAttempts() {
        this.attempts++;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean hasExceededAttempts() {
        return attempts >= 3;
    }
}
