package com.substring.chat.config;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class CloudinaryConfig {

    @Value("${cloudinary.cloud-name}")
    private String cloudName;

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret}")
    private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {
        System.out.println("☁️ Initializing Cloudinary with:");
        System.out.println("   - Cloud Name: " + cloudName);
        System.out.println("   - API Key: "
                + (apiKey != null ? "****" + apiKey.substring(Math.max(0, apiKey.length() - 4)) : "NULL"));

        Map<String, String> config = new HashMap<>();
        config.put("cloud_name", cloudName);
        config.put("api_key", apiKey);
        config.put("api_secret", apiSecret);

        if (cloudName == null || apiKey == null || apiSecret == null) {
            System.out.println("⚠️ WARNING: Cloudinary credentials are INCOMPLETE!");
        }

        return new Cloudinary(config);
    }
}
