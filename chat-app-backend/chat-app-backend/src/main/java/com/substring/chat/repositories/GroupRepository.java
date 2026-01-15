package com.substring.chat.repositories;

import com.substring.chat.entities.Group;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRepository extends MongoRepository<Group, String> {

    /**
     * Find groups owned by user
     */
    List<Group> findByOwnerIdOrderByCreatedAtDesc(String ownerId);

    /**
     * Find group by invite link
     */
    Optional<Group> findByInviteLink(String inviteLink);

    /**
     * Search groups by name (case-insensitive)
     */
    @Query("{ 'name': { $regex: ?0, $options: 'i' }, 'isPrivate': false }")
    List<Group> searchPublicGroups(String keyword);

    /**
     * Find all public groups
     */
    List<Group> findByIsPrivateFalseOrderByMemberCountDesc();
}
