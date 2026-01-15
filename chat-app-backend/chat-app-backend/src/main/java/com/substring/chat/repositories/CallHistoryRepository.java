package com.substring.chat.repositories;

import com.substring.chat.entities.CallSession;
import com.substring.chat.entities.CallStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CallHistoryRepository extends MongoRepository<CallSession, String> {

    @Query("{ '$or': [ { 'initiatorId': ?0 }, { 'participantIds': ?0 } ] }")
    List<CallSession> findByUserIdOrderByStartedAtDesc(String userId);

    @Query("{ '$and': [ { '$or': [ { 'initiatorId': ?0 }, { 'participantIds': ?0 } ] }, { 'status': 'ACTIVE' } ] }")
    Optional<CallSession> findActiveSessionByUser(String userId);
}
