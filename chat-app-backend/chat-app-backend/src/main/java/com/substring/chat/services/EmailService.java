package com.substring.chat.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Send OTP email with professional HTML template
     */
    public void sendOTP(String toEmail, String otp) {
        try {
            log.info("🔧 Attempting to send OTP email to: {}", toEmail);
            log.info("📧 From email: {}", fromEmail);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Your ZapChat OTP Code");
            helper.setText(buildOTPEmailTemplate(otp), true);

            log.info("📤 Sending email via SMTP...");
            mailSender.send(message);
            log.info("✅ OTP email sent successfully to: {}", toEmail);

        } catch (MessagingException e) {
            log.error("❌ MessagingException while sending OTP email to {}", toEmail);
            log.error("❌ Error message: {}", e.getMessage());
            log.error("❌ Error cause: {}", e.getCause());
            e.printStackTrace();
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage());
        } catch (Exception e) {
            log.error("❌ Unexpected exception while sending OTP email to {}", toEmail);
            log.error("❌ Error: {}", e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage());
        }
    }

    /**
     * Send welcome email to new users
     */
    public void sendWelcomeEmail(String toEmail, String name) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Welcome to ZapChat! 🎉");
            helper.setText(buildWelcomeEmailTemplate(name), true);

            mailSender.send(message);
            log.info("📧 Welcome email sent to: {}", toEmail);

        } catch (MessagingException e) {
            log.error("❌ Failed to send welcome email to {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Build HTML email template for OTP
     */
    private String buildOTPEmailTemplate(String otp) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            margin: 0;
                            padding: 20px;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            background: white;
                            border-radius: 16px;
                            overflow: hidden;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        }
                        .header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            padding: 40px 20px;
                            text-align: center;
                        }
                        .header h1 {
                            color: white;
                            margin: 0;
                            font-size: 32px;
                            font-weight: 700;
                        }
                        .content {
                            padding: 40px 30px;
                            text-align: center;
                        }
                        .otp-box {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            font-size: 48px;
                            font-weight: 700;
                            letter-spacing: 8px;
                            padding: 20px;
                            border-radius: 12px;
                            margin: 30px 0;
                            display: inline-block;
                        }
                        .message {
                            color: #333;
                            font-size: 16px;
                            line-height: 1.6;
                            margin: 20px 0;
                        }
                        .warning {
                            background: #fff3cd;
                            border-left: 4px solid #ffc107;
                            padding: 15px;
                            margin: 20px 0;
                            border-radius: 4px;
                            text-align: left;
                        }
                        .footer {
                            background: #f8f9fa;
                            padding: 20px;
                            text-align: center;
                            color: #6c757d;
                            font-size: 14px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>💬 ZapChat</h1>
                        </div>
                        <div class="content">
                            <h2 style="color: #333; margin-top: 0;">Your OTP Code</h2>
                            <p class="message">
                                Enter this code to verify your email and login to ZapChat:
                            </p>
                            <div class="otp-box">"""
                + otp + """
                        </div>
                                                    <div class="warning">
                                                        <strong>⚠️ Security Notice:</strong><br>
                                                        • This code expires in <strong>2 minutes</strong><br>
                                                        • Never share this code with anyone<br>
                                                        • ZapChat will never ask for your OTP via phone or email
                                                    </div>
                                                    <p class="message" style="color: #6c757d; font-size: 14px;">
                                                        If you didn't request this code, please ignore this email.
                                                    </p>
                                                </div>
                                                <div class="footer">
                                                    <p>© 2024 ZapChat. All rights reserved.</p>
                                                    <p>This is an automated email. Please do not reply.</p>
                                                </div>
                                            </div>
                                        </body>
                                        </html>
                                        """;
    }

    /**
     * Build HTML email template for welcome message
     */
    private String buildWelcomeEmailTemplate(String name) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            margin: 0;
                            padding: 20px;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            background: white;
                            border-radius: 16px;
                            overflow: hidden;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        }
                        .header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            padding: 40px 20px;
                            text-align: center;
                            color: white;
                        }
                        .content {
                            padding: 40px 30px;
                        }
                        .footer {
                            background: #f8f9fa;
                            padding: 20px;
                            text-align: center;
                            color: #6c757d;
                            font-size: 14px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Welcome to ZapChat!</h1>
                        </div>
                        <div class="content">
                            <h2>Hi """ + name + """
                ,</h2>
                                            <p>Welcome to ZapChat - your new favorite way to stay connected!</p>
                                            <p>You can now:</p>
                                            <ul>
                                                <li>💬 Chat with friends in real-time</li>
                                                <li>📞 Make voice and video calls</li>
                                                <li>👥 Create and join groups</li>
                                                <li>📁 Share files and media</li>
                                            </ul>
                                            <p>Get started by logging in and connecting with your friends!</p>
                                        </div>
                                        <div class="footer">
                                            <p>© 2024 ZapChat. All rights reserved.</p>
                                        </div>
                                    </div>
                                </body>
                                </html>
                                """;
    }
}
