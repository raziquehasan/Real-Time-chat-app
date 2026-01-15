package com.substring.chat.repositories;

import com.substring.chat.entities.ChannelMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChannelMessageRepository extends MongoRepository<ChannelMessage, String> {

    /**
     * Find messages in a channel with pagination
     */
    Page<ChannelMessage> findByChannelIdAndDeletedFalseOrderByTimestampDesc(
            String channelId, Pageable pageable);

    /**
     * Count messages in channel
     */
    long countByChannelIdAndDeletedFalse(String channelId);
}
