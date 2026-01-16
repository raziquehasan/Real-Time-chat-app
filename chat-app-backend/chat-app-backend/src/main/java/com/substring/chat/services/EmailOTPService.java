package com.substring.chat.services;

import com.substring.chat.entities.EmailOTPRequest;
import com.substring.chat.repositories.EmailOTPRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailOTPService {

    private final EmailOTPRequestRepository emailOTPRequestRepository;
    private final EmailService emailService;

    @Value("${otp.expiry.minutes:2}")
    private int otpExpiryMinutes;

    @Value("${otp.max.attempts:3}")
    private int maxAttempts;

    private static final SecureRandom random = new SecureRandom();

    /**
     * Generate a 6-digit OTP
     */
    public String generateOTP() {
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    /**
     * Send OTP to email address
     */
    public boolean sendOTP(String email) {
        try {
            // Normalize email (lowercase, trim)
            email = email.toLowerCase().trim();

            // Generate OTP
            String otpCode = generateOTP();

            // Save to Redis
            EmailOTPRequest otpRequest = new EmailOTPRequest(email, otpCode);
            emailOTPRequestRepository.save(otpRequest);

            // Send via Email
            emailService.sendOTP(email, otpCode);

            log.info("📧 OTP sent successfully to: {}", email);
            return true;

        } catch (Exception e) {
            // Cleanup if sending failed
            try {
                emailOTPRequestRepository.deleteByEmail(email);
            } catch (Exception cleanupEx) {
                log.warn("Failed to cleanup OTP after send failure: {}", cleanupEx.getMessage());
            }
            log.error("Error sending OTP to {}: {}", email, e.getMessage());
            return false;
        }
    }

    /**
     * Verify OTP
     */
    public boolean verifyOTP(String email, String otpCode) {
        try {
            email = email.toLowerCase().trim();

            Optional<EmailOTPRequest> otpRequestOpt = emailOTPRequestRepository.findByEmail(email);

            if (otpRequestOpt.isEmpty()) {
                log.warn("No OTP found for email: {}", email);
                return false;
            }

            EmailOTPRequest otpRequest = otpRequestOpt.get();

            // Check if expired
            if (otpRequest.isExpired()) {
                log.warn("OTP expired for email: {}", email);
                emailOTPRequestRepository.deleteByEmail(email);
                return false;
            }

            // Check if max attempts exceeded
            if (otpRequest.hasExceededAttempts()) {
                log.warn("Max OTP attempts exceeded for email: {}", email);
                emailOTPRequestRepository.deleteByEmail(email);
                return false;
            }

            // Verify OTP
            if (otpRequest.getOtpCode().equals(otpCode)) {
                log.info("✅ OTP verified successfully for email: {}", email);
                // Delete OTP after successful verification
                emailOTPRequestRepository.deleteByEmail(email);
                return true;
            } else {
                // Increment attempts
                otpRequest.incrementAttempts();
                emailOTPRequestRepository.save(otpRequest);
                log.warn("❌ Invalid OTP for email: {}. Attempts: {}", email, otpRequest.getAttempts());
                return false;
            }
        } catch (Exception e) {
            log.error("Error verifying OTP for {}: {}", email, e.getMessage());
            return false;
        }
    }

    /**
     * Invalidate OTP
     */
    public void invalidateOTP(String email) {
        try {
            email = email.toLowerCase().trim();
            emailOTPRequestRepository.deleteByEmail(email);
            log.info("OTP invalidated for email: {}", email);
        } catch (Exception e) {
            log.error("Error invalidating OTP for {}: {}", email, e.getMessage());
        }
    }

    /**
     * Check if OTP exists and is valid
     */
    public boolean hasValidOTP(String email) {
        email = email.toLowerCase().trim();
        Optional<EmailOTPRequest> otpRequestOpt = emailOTPRequestRepository.findByEmail(email);
        if (otpRequestOpt.isEmpty()) {
            return false;
        }
        EmailOTPRequest otpRequest = otpRequestOpt.get();
        return !otpRequest.isExpired() && !otpRequest.hasExceededAttempts();
    }
}
