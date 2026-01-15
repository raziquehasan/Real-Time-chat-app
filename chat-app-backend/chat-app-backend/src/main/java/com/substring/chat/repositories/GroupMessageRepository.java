package com.substring.chat.repositories;

import com.substring.chat.entities.GroupMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupMessageRepository extends MongoRepository<GroupMessage, String> {

    /**
     * Find messages in a group with pagination
     */
    Page<GroupMessage> findByGroupIdAndDeletedForEveryoneFalseOrderByTimestampDesc(
            String groupId, Pageable pageable);

    /**
     * Search messages in a group
     */
    @Query("{ 'groupId': ?0, 'content': { $regex: ?1, $options: 'i' }, 'deletedForEveryone': false }")
    List<GroupMessage> searchMessages(String groupId, String query);

    /**
     * Find pinned messages
     */
    List<GroupMessage> findByGroupIdAndIsPinnedTrueOrderByTimestampDesc(String groupId);

    /**
     * Find messages mentioning a user
     */
    @Query("{ 'groupId': ?0, 'mentionedUserIds': ?1, 'deletedForEveryone': false }")
    List<GroupMessage> findMessagesMentioningUser(String groupId, String userId);

    /**
     * Count unread messages for user
     */
    @Query(value = "{ 'groupId': ?0, 'timestamp': { $gt: ?1 } }", count = true)
    long countUnreadMessages(String groupId, java.time.LocalDateTime lastReadAt);
}
