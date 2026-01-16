package com.substring.chat.controllers;

import com.substring.chat.dto.AuthResponse;
import com.substring.chat.dto.SendOTPRequest;
import com.substring.chat.dto.VerifyOTPRequest;
import com.substring.chat.entities.User;
import com.substring.chat.repositories.UserRepository;
import com.substring.chat.config.JwtUtil;
import com.substring.chat.services.OTPService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class OTPAuthController {

    private final OTPService otpService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    // Rate limiting maps (in-memory, use Redis in production)
    private final Map<String, RateLimitInfo> phoneRateLimits = new ConcurrentHashMap<>();
    private final Map<String, RateLimitInfo> ipRateLimits = new ConcurrentHashMap<>();

    private static final int MAX_OTP_PER_HOUR = 3;
    private static final int MAX_REQUESTS_PER_IP_PER_MINUTE = 5;

    /**
     * Send OTP to phone number
     */
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOTP(@Valid @RequestBody SendOTPRequest request,
            HttpServletRequest httpRequest) {
        try {
            String phoneNumber = normalizePhoneNumber(request.getPhoneNumber());
            String clientIp = getClientIP(httpRequest);

            // Rate limiting - IP based
            if (isIPRateLimited(clientIp)) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(Map.of(
                                "success", false,
                                "message", "Too many requests. Please try again later."));
            }

            // Rate limiting - Phone based
            if (isPhoneRateLimited(phoneNumber)) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(Map.of(
                                "success", false,
                                "message", "Maximum OTP requests reached. Please try again after 1 hour."));
            }

            // Send OTP
            boolean sent = otpService.sendOTP(phoneNumber);

            if (sent) {
                // Update rate limits
                updatePhoneRateLimit(phoneNumber);
                updateIPRateLimit(clientIp);

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "OTP sent successfully",
                        "expiresIn", 120 // 2 minutes
                ));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of(
                                "success", false,
                                "message", "Failed to send OTP. Please try again."));
            }

        } catch (Exception e) {
            log.error("Error in sendOTP: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "message", "An error occurred. Please try again."));
        }
    }

    /**
     * Verify OTP and login/register user
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOTP(@Valid @RequestBody VerifyOTPRequest request) {
        try {
            String phoneNumber = normalizePhoneNumber(request.getPhoneNumber());
            String otp = request.getOtp();

            // Verify OTP
            boolean verified = otpService.verifyOTP(phoneNumber, otp);

            if (!verified) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of(
                                "success", false,
                                "message", "Invalid or expired OTP"));
            }

            // Find or create user
            User user = userRepository.findByPhoneNumber(phoneNumber)
                    .orElseGet(() -> createNewUser(phoneNumber));

            // Update user
            user.setVerified(true);
            user.setLastLoginAt(LocalDateTime.now());
            user.setOnline(true);
            userRepository.save(user);

            // Generate JWT token
            String token = jwtUtil.generateToken(user.getPhoneNumber());

            log.info("User logged in successfully: {}", phoneNumber);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Login successful",
                    "token", token,
                    "user", user));

        } catch (Exception e) {
            log.error("Error in verifyOTP: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "message", "An error occurred. Please try again."));
        }
    }

    /**
     * Create new user
     */
    private User createNewUser(String phoneNumber) {
        User user = new User();
        user.setPhoneNumber(phoneNumber);
        user.setName("User"); // Default name, can be updated later
        user.setVerified(false);
        user.setOnline(false);
        user.setCreatedAt(LocalDateTime.now());
        user.setLastSeen(LocalDateTime.now());
        return user;
    }

    /**
     * Normalize phone number
     */
    private String normalizePhoneNumber(String phoneNumber) {
        // Remove all non-digit characters
        String cleaned = phoneNumber.replaceAll("[^0-9]", "");

        // Add +91 if not present
        if (!cleaned.startsWith("91")) {
            cleaned = "91" + cleaned;
        }

        return "+" + cleaned;
    }

    /**
     * Get client IP address
     */
    private String getClientIP(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }

    /**
     * Check if phone is rate limited
     */
    private boolean isPhoneRateLimited(String phoneNumber) {
        RateLimitInfo info = phoneRateLimits.get(phoneNumber);
        if (info == null) {
            return false;
        }

        // Reset if hour has passed
        if (LocalDateTime.now().isAfter(info.resetTime)) {
            phoneRateLimits.remove(phoneNumber);
            return false;
        }

        return info.count >= MAX_OTP_PER_HOUR;
    }

    /**
     * Check if IP is rate limited
     */
    private boolean isIPRateLimited(String ip) {
        RateLimitInfo info = ipRateLimits.get(ip);
        if (info == null) {
            return false;
        }

        // Reset if minute has passed
        if (LocalDateTime.now().isAfter(info.resetTime)) {
            ipRateLimits.remove(ip);
            return false;
        }

        return info.count >= MAX_REQUESTS_PER_IP_PER_MINUTE;
    }

    /**
     * Update phone rate limit
     */
    private void updatePhoneRateLimit(String phoneNumber) {
        RateLimitInfo info = phoneRateLimits.get(phoneNumber);
        if (info == null) {
            phoneRateLimits.put(phoneNumber, new RateLimitInfo(1, LocalDateTime.now().plusHours(1)));
        } else {
            info.count++;
        }
    }

    /**
     * Update IP rate limit
     */
    private void updateIPRateLimit(String ip) {
        RateLimitInfo info = ipRateLimits.get(ip);
        if (info == null) {
            ipRateLimits.put(ip, new RateLimitInfo(1, LocalDateTime.now().plusMinutes(1)));
        } else {
            info.count++;
        }
    }

    /**
     * Rate limit info class
     */
    private static class RateLimitInfo {
        int count;
        LocalDateTime resetTime;

        RateLimitInfo(int count, LocalDateTime resetTime) {
            this.count = count;
            this.resetTime = resetTime;
        }
    }
}
