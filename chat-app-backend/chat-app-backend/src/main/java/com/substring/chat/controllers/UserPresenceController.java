package com.substring.chat.controllers;

import com.substring.chat.entities.UserPresence;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class UserPresenceController {

    // Store active users: roomId -> List of UserPresence
    private static final Map<String, List<UserPresence>> activeUsersPerRoom = new ConcurrentHashMap<>();

    @MessageMapping("/join/{roomId}")
    @SendTo("/topic/users/{roomId}")
    public List<UserPresence> userJoin(
            @DestinationVariable String roomId,
            UserPresence user) {
        System.out.println("👤 User joining: " + user.getUserName() + " in room " + roomId);

        user.setRoomId(roomId);
        user.setJoinedAt(LocalDateTime.now());
        user.setOnline(true);

        // Get or create user list for this room
        activeUsersPerRoom.putIfAbsent(roomId, new ArrayList<>());
        List<UserPresence> roomUsers = activeUsersPerRoom.get(roomId);

        // Check if user already exists (by userName)
        boolean userExists = roomUsers.stream()
                .anyMatch(u -> u.getUserName().equals(user.getUserName()));

        if (!userExists) {
            roomUsers.add(user);
            System.out.println("✅ User added. Total users in room " + roomId + ": " + roomUsers.size());
        } else {
            System.out.println("⚠️ User already in room: " + user.getUserName());
        }

        return new ArrayList<>(roomUsers);
    }

    @MessageMapping("/leave/{roomId}")
    @SendTo("/topic/users/{roomId}")
    public List<UserPresence> userLeave(
            @DestinationVariable String roomId,
            UserPresence user) {
        System.out.println("👋 User leaving: " + user.getUserName() + " from room " + roomId);

        List<UserPresence> roomUsers = activeUsersPerRoom.get(roomId);

        if (roomUsers != null) {
            // Remove user by userName
            roomUsers.removeIf(u -> u.getUserName().equals(user.getUserName()));
            System.out.println("✅ User removed. Remaining users in room " + roomId + ": " + roomUsers.size());

            // Clean up empty rooms
            if (roomUsers.isEmpty()) {
                activeUsersPerRoom.remove(roomId);
                System.out.println("🗑️ Room " + roomId + " is now empty and removed");
            }

            return new ArrayList<>(roomUsers);
        }

        return new ArrayList<>();
    }

    // Helper method to get active users in a room
    public static List<UserPresence> getActiveUsers(String roomId) {
        return activeUsersPerRoom.getOrDefault(roomId, new ArrayList<>());
    }
}
