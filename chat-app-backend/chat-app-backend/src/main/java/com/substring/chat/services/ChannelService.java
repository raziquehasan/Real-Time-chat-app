package com.substring.chat.services;

import com.substring.chat.entities.Channel;
import com.substring.chat.repositories.ChannelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

@Service
public class ChannelService {

    @Autowired
    private ChannelRepository channelRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // In-memory subscriber tracking (use Redis in production)
    private Map<String, HashSet<String>> channelSubscribers = new HashMap<>();

    /**
     * Create new channel
     */
    public Channel createChannel(String ownerId, String ownerName, String name, String description, String avatarUrl) {
        Channel channel = new Channel();
        channel.setName(name);
        channel.setDescription(description);
        channel.setAvatarUrl(avatarUrl);
        channel.setOwnerId(ownerId);
        channel.setOwnerName(ownerName);
        channel.setCreatedAt(LocalDateTime.now());
        channel.setUpdatedAt(LocalDateTime.now());
        channel.setSubscriberCount(1); // Owner is first subscriber

        Channel saved = channelRepository.save(channel);

        // Add owner as subscriber
        subscribe(saved.getId(), ownerId);

        return saved;
    }

    /**
     * Update channel details
     */
    public Channel updateChannel(String channelId, String name, String description, String avatarUrl) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("Channel not found"));

        if (name != null)
            channel.setName(name);
        if (description != null)
            channel.setDescription(description);
        if (avatarUrl != null)
            channel.setAvatarUrl(avatarUrl);
        channel.setUpdatedAt(LocalDateTime.now());

        return channelRepository.save(channel);
    }

    /**
     * Delete channel
     */
    @Transactional
    public void deleteChannel(String channelId) {
        channelRepository.deleteById(channelId);
        channelSubscribers.remove(channelId);
    }

    /**
     * Subscribe to channel
     */
    public void subscribe(String channelId, String userId) {
        channelSubscribers.computeIfAbsent(channelId, k -> new HashSet<>()).add(userId);

        // Update subscriber count
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("Channel not found"));
        channel.setSubscriberCount(channelSubscribers.get(channelId).size());
        channelRepository.save(channel);

        // Broadcast subscription event
        Map<String, Object> event = new HashMap<>();
        event.put("type", "USER_SUBSCRIBED");
        event.put("userId", userId);
        event.put("subscriberCount", channel.getSubscriberCount());
        messagingTemplate.convertAndSend("/topic/channel/" + channelId + "/events", event);
    }

    /**
     * Unsubscribe from channel
     */
    public void unsubscribe(String channelId, String userId) {
        HashSet<String> subscribers = channelSubscribers.get(channelId);
        if (subscribers != null) {
            subscribers.remove(userId);

            // Update subscriber count
            Channel channel = channelRepository.findById(channelId)
                    .orElseThrow(() -> new RuntimeException("Channel not found"));
            channel.setSubscriberCount(subscribers.size());
            channelRepository.save(channel);

            // Broadcast unsubscription event
            Map<String, Object> event = new HashMap<>();
            event.put("type", "USER_UNSUBSCRIBED");
            event.put("userId", userId);
            event.put("subscriberCount", channel.getSubscriberCount());
            messagingTemplate.convertAndSend("/topic/channel/" + channelId + "/events", event);
        }
    }

    /**
     * Get user's subscribed channels
     */
    public List<Channel> getUserChannels(String userId) {
        // In production, store subscriptions in database
        return channelRepository.findAll().stream()
                .filter(channel -> {
                    HashSet<String> subscribers = channelSubscribers.get(channel.getId());
                    return subscribers != null && subscribers.contains(userId);
                })
                .toList();
    }

    /**
     * Check if user is subscribed
     */
    public boolean isSubscribed(String channelId, String userId) {
        HashSet<String> subscribers = channelSubscribers.get(channelId);
        return subscribers != null && subscribers.contains(userId);
    }

    /**
     * Check if user is owner or admin
     */
    public boolean isChannelAdmin(String channelId, String userId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("Channel not found"));
        return channel.getOwnerId().equals(userId) || channel.getAdminIds().contains(userId);
    }
}
