package com.substring.chat.controllers;

import com.substring.chat.payload.TypingNotification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class TypingIndicatorController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Handle typing indicator
     * Endpoint: /app/typing
     */
    @MessageMapping("/typing")
    public void handleTyping(@Payload TypingNotification notification) {
        System.out.println("👀 Typing notification: " + notification.getUserName() +
                " is " + (notification.isTyping() ? "typing" : "stopped typing"));

        // Send typing notification to the receiver
        messagingTemplate.convertAndSendToUser(
                notification.getReceiverId(),
                "/queue/typing",
                notification);
    }
}
