package com.substring.chat.services;

import com.substring.chat.entities.User;
import com.substring.chat.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class UserStatusService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Update user online status
     */
    public void setUserOnline(String userId, boolean online) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                user.setOnline(online);
                if (!online) {
                    user.setLastSeen(LocalDateTime.now());
                }
                userRepository.save(user);

                // Broadcast status change to all users
                Map<String, Object> statusUpdate = new HashMap<>();
                statusUpdate.put("userId", userId);
                statusUpdate.put("online", online);
                statusUpdate.put("lastSeen", user.getLastSeen());

                messagingTemplate.convertAndSend("/topic/user-status", statusUpdate);

                System.out.println("📡 User " + user.getName() + " is now " + (online ? "online" : "offline"));
            }
        } catch (Exception e) {
            System.err.println("Error updating user status: " + e.getMessage());
        }
    }

    /**
     * Update last seen timestamp
     */
    public void updateLastSeen(String userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                user.setLastSeen(LocalDateTime.now());
                userRepository.save(user);
            }
        } catch (Exception e) {
            System.err.println("Error updating last seen: " + e.getMessage());
        }
    }
}
