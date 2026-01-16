package com.substring.chat.controllers;

import com.substring.chat.config.JwtUtil;
import com.substring.chat.dto.SendEmailOTPRequest;
import com.substring.chat.dto.VerifyEmailOTPRequest;
import com.substring.chat.entities.User;
import com.substring.chat.repositories.UserRepository;
import com.substring.chat.services.EmailOTPService;
import com.substring.chat.services.EmailService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class EmailOTPAuthController {

    private final EmailOTPService emailOTPService;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    // Rate limiting maps
    private final Map<String, Long> emailRateLimitMap = new ConcurrentHashMap<>();
    private final Map<String, Integer> emailOTPCountMap = new ConcurrentHashMap<>();
    private final Map<String, Long> ipRateLimitMap = new ConcurrentHashMap<>();

    /**
     * Send OTP to email
     */
    @PostMapping("/send-email-otp")
    public ResponseEntity<Map<String, Object>> sendEmailOTP(
            @Valid @RequestBody SendEmailOTPRequest request,
            HttpServletRequest httpRequest) {

        String email = request.getEmail().toLowerCase().trim();
        String clientIP = getClientIP(httpRequest);

        log.info("📧 OTP request for email: {} from IP: {}", email, clientIP);

        // IP Rate limiting: 5 requests per minute
        if (isIPRateLimited(clientIP)) {
            log.warn("⚠️ IP rate limit exceeded for: {}", clientIP);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of(
                            "success", false,
                            "message", "Too many requests. Please try again later."));
        }

        // Email Rate limiting: 3 OTP per hour
        if (isEmailRateLimited(email)) {
            log.warn("⚠️ Email rate limit exceeded for: {}", email);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of(
                            "success", false,
                            "message", "Maximum OTP requests reached. Please try again after 1 hour."));
        }

        try {
            // Send OTP
            boolean sent = emailOTPService.sendOTP(email);

            if (sent) {
                // Update rate limiting
                updateRateLimits(email, clientIP);

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "OTP sent successfully to your email",
                        "email", email));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of(
                                "success", false,
                                "message", "Failed to send OTP. Please try again."));
            }
        } catch (Exception e) {
            log.error("Error sending OTP to {}: {}", email, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "message", "An error occurred. Please try again."));
        }
    }

    /**
     * Verify OTP and login
     */
    @PostMapping("/verify-email-otp")
    public ResponseEntity<Map<String, Object>> verifyEmailOTP(
            @Valid @RequestBody VerifyEmailOTPRequest request) {

        String email = request.getEmail().toLowerCase().trim();
        String otpCode = request.getOtpCode();

        log.info("🔐 OTP verification attempt for email: {}", email);

        try {
            // Verify OTP
            boolean verified = emailOTPService.verifyOTP(email, otpCode);

            if (!verified) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of(
                                "success", false,
                                "message", "Invalid or expired OTP"));
            }

            // Find or create user
            User user = userRepository.findByEmail(email)
                    .orElseGet(() -> createNewUser(email));

            // Update user verification status
            user.setVerified(true);
            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);

            // Generate JWT token
            String token = jwtUtil.generateToken(user.getEmail());

            log.info("✅ User logged in successfully: {}", email);

            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Login successful");
            response.put("token", token);
            response.put("user", Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "profilePicture", user.getProfilePicture() != null ? user.getProfilePicture() : ""));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error verifying OTP for {}: {}", email, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "message", "An error occurred. Please try again."));
        }
    }

    /**
     * Create new user from email
     */
    private User createNewUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setName(email.split("@")[0]); // Use email prefix as default name
        user.setVerified(true);
        user.setCreatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        // Send welcome email asynchronously
        try {
            emailService.sendWelcomeEmail(email, savedUser.getName());
        } catch (Exception e) {
            log.warn("Failed to send welcome email: {}", e.getMessage());
        }

        log.info("✨ New user created: {}", email);
        return savedUser;
    }

    /**
     * Check if IP is rate limited (5 requests per minute)
     */
    private boolean isIPRateLimited(String ip) {
        long now = System.currentTimeMillis();
        Long lastRequest = ipRateLimitMap.get(ip);

        if (lastRequest == null || (now - lastRequest) > 60000) {
            return false;
        }

        // Check request count in last minute
        return (now - lastRequest) < 12000; // 5 requests = 12 seconds minimum gap
    }

    /**
     * Check if email is rate limited (3 OTP per hour)
     */
    private boolean isEmailRateLimited(String email) {
        long now = System.currentTimeMillis();
        Long firstRequest = emailRateLimitMap.get(email);

        if (firstRequest == null || (now - firstRequest) > 3600000) {
            // Reset if more than 1 hour
            emailRateLimitMap.put(email, now);
            emailOTPCountMap.put(email, 0);
            return false;
        }

        Integer count = emailOTPCountMap.getOrDefault(email, 0);
        return count >= 3;
    }

    /**
     * Update rate limiting maps
     */
    private void updateRateLimits(String email, String ip) {
        long now = System.currentTimeMillis();

        // Update IP rate limit
        ipRateLimitMap.put(ip, now);

        // Update email rate limit
        if (!emailRateLimitMap.containsKey(email)) {
            emailRateLimitMap.put(email, now);
        }
        emailOTPCountMap.put(email, emailOTPCountMap.getOrDefault(email, 0) + 1);
    }

    /**
     * Get client IP address
     */
    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
