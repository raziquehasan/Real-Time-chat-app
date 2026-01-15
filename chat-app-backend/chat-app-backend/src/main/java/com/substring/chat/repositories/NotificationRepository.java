package com.substring.chat.repositories;

import com.substring.chat.entities.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    /**
     * Find all notifications for a user, ordered by creation date (newest first)
     */
    Page<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    /**
     * Find unread notifications for a user
     */
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(String userId);

    /**
     * Count unread notifications for a user
     */
    long countByUserIdAndIsReadFalse(String userId);

    /**
     * Delete all notifications for a user
     */
    void deleteByUserId(String userId);

    /**
     * Delete old read notifications (for cleanup jobs)
     */
    void deleteByIsReadTrueAndCreatedAtBefore(LocalDateTime date);
}
