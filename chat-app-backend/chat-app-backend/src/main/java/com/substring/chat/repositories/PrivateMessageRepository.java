package com.substring.chat.repositories;

import com.substring.chat.entities.PrivateMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface PrivateMessageRepository extends MongoRepository<PrivateMessage, String> {

    // Find messages between two users (both directions)
    @Query("{ $or: [ " +
            "{ 'senderId': ?0, 'receiverId': ?1 }, " +
            "{ 'senderId': ?1, 'receiverId': ?0 } " +
            "] }")
    List<PrivateMessage> findMessagesBetweenUsers(String userId1, String userId2, Pageable pageable);

    // Find unread messages for a user from a specific sender
    List<PrivateMessage> findByReceiverIdAndSenderIdAndIsReadFalse(String receiverId, String senderId);

    // Count unread messages for a user
    long countByReceiverIdAndIsReadFalse(String receiverId);

    // Optimized aggregation to finding latest message for each conversation
    @Aggregation(pipeline = {
            "{ $match: { $or: [ { 'senderId': ?0 }, { 'receiverId': ?0 } ] } }",
            "{ $sort: { timestamp: -1 } }",
            "{ $group: { _id: { $cond: [ { $eq: ['$senderId', ?0] }, '$receiverId', '$senderId' ] }, lastMessage: { $first: '$$ROOT' } } }",
            "{ $replaceRoot: { newRoot: '$lastMessage' } }",
            "{ $sort: { timestamp: -1 } }"
    })
    List<PrivateMessage> findConversationsAggregation(String userId);
}
