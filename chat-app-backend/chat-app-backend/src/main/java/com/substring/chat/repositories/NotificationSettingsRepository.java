package com.substring.chat.repositories;

import com.substring.chat.entities.NotificationSettings;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationSettingsRepository extends MongoRepository<NotificationSettings, String> {

    /**
     * Find notification settings by user ID
     */
    Optional<NotificationSettings> findByUserId(String userId);

    /**
     * Delete settings by user ID
     */
    void deleteByUserId(String userId);
}
