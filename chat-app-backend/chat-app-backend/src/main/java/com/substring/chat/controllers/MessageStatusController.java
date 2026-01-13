package com.substring.chat.controllers;

import com.substring.chat.entities.Message;
import com.substring.chat.playload.MessageStatusUpdate;
import com.substring.chat.repositories.RoomRepository;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class MessageStatusController {

    private final RoomRepository roomRepository;

    public MessageStatusController(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @MessageMapping("/status/{roomId}")
    @SendTo("/topic/status/{roomId}")
    public MessageStatusUpdate updateMessageStatus(
            @DestinationVariable String roomId,
            MessageStatusUpdate statusUpdate) {
        System.out.println("📊 Status update: " + statusUpdate.getStatus() +
                " for message " + statusUpdate.getMessageId() +
                " by " + statusUpdate.getUserName());

        // In a real app, you would update the message in database
        // For now, just broadcast the status update

        return statusUpdate;
    }
}
