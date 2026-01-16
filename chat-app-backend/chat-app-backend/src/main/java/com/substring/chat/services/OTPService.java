package com.substring.chat.services;

import com.substring.chat.entities.OTPRequest;
import com.substring.chat.repositories.OTPRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OTPService {

    private final OTPRequestRepository otpRequestRepository;
    private final Fast2SMSService fast2SMSService;

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
     * Send OTP to phone number
     */
    public boolean sendOTP(String phoneNumber) {
        try {
            // Check rate limiting (handled in controller)

            // Generate OTP
            String otpCode = generateOTP();

            // Save to Redis
            OTPRequest otpRequest = new OTPRequest(phoneNumber, otpCode);
            otpRequestRepository.save(otpRequest);

            // Send via Fast2SMS
            boolean sent = fast2SMSService.sendOTP(phoneNumber, otpCode);

            if (sent) {
                log.info("OTP sent successfully to: {}", phoneNumber);
                return true;
            } else {
                // Cleanup if sending failed
                otpRequestRepository.deleteByPhoneNumber(phoneNumber);
                log.error("Failed to send OTP to: {}", phoneNumber);
                return false;
            }
        } catch (Exception e) {
            log.error("Error sending OTP to {}: {}", phoneNumber, e.getMessage());
            return false;
        }
    }

    /**
     * Verify OTP
     */
    public boolean verifyOTP(String phoneNumber, String otpCode) {
        try {
            Optional<OTPRequest> otpRequestOpt = otpRequestRepository.findByPhoneNumber(phoneNumber);

            if (otpRequestOpt.isEmpty()) {
                log.warn("No OTP found for phone: {}", phoneNumber);
                return false;
            }

            OTPRequest otpRequest = otpRequestOpt.get();

            // Check if expired
            if (otpRequest.isExpired()) {
                log.warn("OTP expired for phone: {}", phoneNumber);
                otpRequestRepository.deleteByPhoneNumber(phoneNumber);
                return false;
            }

            // Check if max attempts exceeded
            if (otpRequest.hasExceededAttempts()) {
                log.warn("Max OTP attempts exceeded for phone: {}", phoneNumber);
                otpRequestRepository.deleteByPhoneNumber(phoneNumber);
                return false;
            }

            // Verify OTP
            if (otpRequest.getOtpCode().equals(otpCode)) {
                log.info("OTP verified successfully for phone: {}", phoneNumber);
                // Delete OTP after successful verification
                otpRequestRepository.deleteByPhoneNumber(phoneNumber);
                return true;
            } else {
                // Increment attempts
                otpRequest.incrementAttempts();
                otpRequestRepository.save(otpRequest);
                log.warn("Invalid OTP for phone: {}. Attempts: {}", phoneNumber, otpRequest.getAttempts());
                return false;
            }
        } catch (Exception e) {
            log.error("Error verifying OTP for {}: {}", phoneNumber, e.getMessage());
            return false;
        }
    }

    /**
     * Invalidate OTP
     */
    public void invalidateOTP(String phoneNumber) {
        try {
            otpRequestRepository.deleteByPhoneNumber(phoneNumber);
            log.info("OTP invalidated for phone: {}", phoneNumber);
        } catch (Exception e) {
            log.error("Error invalidating OTP for {}: {}", phoneNumber, e.getMessage());
        }
    }

    /**
     * Check if OTP exists and is valid
     */
    public boolean hasValidOTP(String phoneNumber) {
        Optional<OTPRequest> otpRequestOpt = otpRequestRepository.findByPhoneNumber(phoneNumber);
        if (otpRequestOpt.isEmpty()) {
            return false;
        }
        OTPRequest otpRequest = otpRequestOpt.get();
        return !otpRequest.isExpired() && !otpRequest.hasExceededAttempts();
    }
}
