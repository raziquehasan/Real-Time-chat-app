package com.substring.chat.repositories;

import com.substring.chat.entities.Channel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChannelRepository extends MongoRepository<Channel, String> {

    /**
     * Find channels owned by user
     */
    List<Channel> findByOwnerIdOrderByCreatedAtDesc(String ownerId);

    /**
     * Search public channels by name
     */
    @Query("{ 'name': { $regex: ?0, $options: 'i' }, 'isPrivate': false }")
    List<Channel> searchPublicChannels(String keyword);

    /**
     * Find all public channels ordered by subscribers
     */
    List<Channel> findByIsPrivateFalseOrderBySubscriberCountDesc();

    /**
     * Find channels where user is admin
     */
    @Query("{ 'adminIds': ?0 }")
    List<Channel> findChannelsByAdmin(String userId);
}
