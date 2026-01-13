package com.substring.chat.controllers;

import com.substring.chat.entities.TypingNotification;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
public class TypingController {

    @MessageMapping("/typing/{roomId}")
    @SendTo("/topic/typing/{roomId}")
    public TypingNotification handleTyping(
            @DestinationVariable String roomId,
            TypingNotification notification) {
        System.out.println("⌨️ Typing event: " + notification.getUserName() +
                " is " + (notification.isTyping() ? "typing" : "stopped typing") +
                " in room " + roomId);

        notification.setTimestamp(LocalDateTime.now());
        notification.setRoomId(roomId);

        return notification;
    }
}
