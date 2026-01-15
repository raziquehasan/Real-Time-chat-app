package com.substring.chat.repositories;

import com.substring.chat.entities.GroupMember;
import com.substring.chat.entities.GroupRole;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends MongoRepository<GroupMember, String> {

    /**
     * Find all members of a group
     */
    List<GroupMember> findByGroupIdOrderByJoinedAtAsc(String groupId);

    /**
     * Find all groups a user is member of
     */
    List<GroupMember> findByUserIdOrderByJoinedAtDesc(String userId);

    /**
     * Find specific member in a group
     */
    Optional<GroupMember> findByGroupIdAndUserId(String groupId, String userId);

    /**
     * Count members in a group
     */
    long countByGroupId(String groupId);

    /**
     * Delete member from group
     */
    void deleteByGroupIdAndUserId(String groupId, String userId);

    /**
     * Find members by role
     */
    List<GroupMember> findByGroupIdAndRole(String groupId, GroupRole role);

    /**
     * Check if user is member
     */
    boolean existsByGroupIdAndUserId(String groupId, String userId);
}
