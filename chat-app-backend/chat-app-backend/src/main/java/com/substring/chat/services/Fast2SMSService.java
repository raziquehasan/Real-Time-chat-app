package com.substring.chat.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Service
@Slf4j
public class Fast2SMSService {

    @Value("${fast2sms.api.key}")
    private String apiKey;

    private static final String FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";
    private final WebClient webClient;

    public Fast2SMSService() {
        this.webClient = WebClient.builder()
                .baseUrl(FAST2SMS_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * Send OTP via Fast2SMS
     * 
     * @param phoneNumber Phone number (10 digits without country code)
     * @param otp         6-digit OTP
     * @return true if sent successfully
     */
    public boolean sendOTP(String phoneNumber, String otp) {
        try {
            // Remove country code if present (+91)
            String cleanedNumber = phoneNumber.replaceAll("[^0-9]", "");
            if (cleanedNumber.startsWith("91") && cleanedNumber.length() == 12) {
                cleanedNumber = cleanedNumber.substring(2);
            }

            log.info("Sending OTP to: {}", cleanedNumber);

            // Build URL with query parameters
            String url = String.format(
                    "?route=otp&variables_values=%s&numbers=%s",
                    otp,
                    cleanedNumber);

            // Make HTTP request
            String response = webClient.get()
                    .uri(url)
                    .header("authorization", apiKey)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            log.info("Fast2SMS Response: {}", response);

            // Check if response contains success indicator
            return response != null && (response.contains("\"return\":true") || response.contains("success"));

        } catch (Exception e) {
            log.error("Error sending OTP via Fast2SMS: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Send custom message via Fast2SMS
     */
    public boolean sendMessage(String phoneNumber, String message) {
        try {
            String cleanedNumber = phoneNumber.replaceAll("[^0-9]", "");
            if (cleanedNumber.startsWith("91") && cleanedNumber.length() == 12) {
                cleanedNumber = cleanedNumber.substring(2);
            }

            String url = String.format(
                    "?route=q&message=%s&language=english&flash=0&numbers=%s",
                    message,
                    cleanedNumber);

            String response = webClient.get()
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
    }
}
