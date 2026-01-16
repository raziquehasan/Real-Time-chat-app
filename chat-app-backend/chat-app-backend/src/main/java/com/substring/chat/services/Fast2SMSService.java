package com.substring.chat.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@Slf4j
public class Fast2SMSService {

    @Value("${fast2sms.api.key}")
    private String apiKey;

    private final WebClient webClient = WebClient.create();

    public void sendOTP(String phone, String otp) {

        // normalize phone number
        phone = phone.replace("+91", "").replaceAll("[^0-9]", "");

        String url = "https://www.fast2sms.com/dev/bulkV2"
                + "?authorization=" + apiKey
                + "&route=otp"
                + "&variables_values=" + otp
                + "&numbers=" + phone;

        log.info("📱 Sending OTP via Fast2SMS to: {}", phone);
        log.info("Fast2SMS URL: {}", url);

        try {
            String response = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("✅ Fast2SMS Response: {}", response);

        } catch (Exception e) {
            log.error("❌ Fast2SMS Error: {}", e.getMessage());
            throw new RuntimeException("Failed to send OTP via Fast2SMS");
        }
    }
}
