package com.substring.chat.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class Fast2SMSService {

    private static final Logger log = LoggerFactory.getLogger(Fast2SMSService.class);

    @Value("${fast2sms.api.key}")
    private String apiKey;

    private final WebClient webClient = WebClient.create();

    /**
     * Normalize phone number - remove +91 and keep only digits
     */
    private String normalizePhone(String phone) {
        if (phone == null) return "";
        phone = phone.replace("+91", "").trim();
        phone = phone.replaceAll("[^0-9]", "");
        return phone;
    }

    /**
     * Send OTP via Fast2SMS using GET request with query parameters
     */
    public void sendOTP(String phoneNumber, String otp) {
        try {
            // Normalize phone number (remove +91, keep only 10 digits)
            String normalizedPhone = normalizePhone(phoneNumber);
            
            if (normalizedPhone.length() != 10) {
                log.error("Invalid phone number after normalization: {}", normalizedPhone);
                throw new RuntimeException("Phone number must be 10 digits");
            }

            // Build Fast2SMS OTP URL with query parameters
            String url = "https://www.fast2sms.com/dev/bulkV2"
                    + "?authorization=" + apiKey
                    + "&route=otp"
                    + "&variables_values=" + otp
                    + "&numbers=" + normalizedPhone;

            log.info("📱 Sending OTP via Fast2SMS to: {}", normalizedPhone);

            // Send GET request
            String response = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .doOnNext(res -> log.info("✅ Fast2SMS Response: {}", res))
                    .doOnError(err -> log.error("❌ Fast2SMS Error: {}", err.getMessage()))
                    .block();

            log.info("OTP sent successfully to {}", normalizedPhone);

        } catch (Exception e) {
            log.error("Failed to send OTP via Fast2SMS: {}", e.getMessage());
            throw new RuntimeException("Failed to send OTP: " + e.getMessage());
        }
    }

    /**
     * Send custom message via Fast2SMS
     */
                    .uri(url)
                    .header("authorization", apiKey)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            log.info("Fast2SMS Message Response: {}", response);
            return response != null && response.contains("\"return\":true");

        } catch (Exception e) {
            log.error("Error sending message via Fast2SMS: {}", e.getMessage(), e);
            return false;
        }
    }}
