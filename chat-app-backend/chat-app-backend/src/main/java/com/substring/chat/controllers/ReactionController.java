package com.substring.chat.controllers;

import com.substring.chat.entities.MessageReaction;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Controller
public class ReactionController {

    // Store reactions: messageId -> List of reactions
    private static final Map<String, List<MessageReaction>> messageReactions = new ConcurrentHashMap<>();

    @MessageMapping("/react/{roomId}")
    @SendTo("/topic/reactions/{roomId}")
    public List<MessageReaction> handleReaction(
            @DestinationVariable String roomId,
            MessageReaction reaction) {
        System.out.println("😊 Reaction: " + reaction.getEmoji() +
                " by " + reaction.getUserName() +
                " on message " + reaction.getMessageId());

        String messageId = reaction.getMessageId();

        // Get or create reaction list for this message
        messageReactions.putIfAbsent(messageId, new ArrayList<>());
        List<MessageReaction> reactions = messageReactions.get(messageId);

        // Check if user already reacted with this emoji
        boolean existingReaction = reactions.stream()
                .anyMatch(r -> r.getUserId().equals(reaction.getUserId()) &&
                        r.getEmoji().equals(reaction.getEmoji()));

        if (existingReaction) {
            // Remove reaction (toggle off)
            reactions.removeIf(r -> r.getUserId().equals(reaction.getUserId()) &&
                    r.getEmoji().equals(reaction.getEmoji()));
            System.out.println("❌ Removed reaction");
        } else {
            // Add new reaction
            reaction.setTimestamp(LocalDateTime.now());
            reactions.add(reaction);
            System.out.println("✅ Added reaction");
        }

        // Return all reactions for this message
        return new ArrayList<>(reactions);
    }

    // Helper method to get reactions for a message
    public static List<MessageReaction> getReactionsForMessage(String messageId) {
        return messageReactions.getOrDefault(messageId, new ArrayList<>());
    }
}
