package com.substring.chat.repositories;

import com.substring.chat.entities.OTPRequest;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OTPRequestRepository extends CrudRepository<OTPRequest, String> {
    Optional<OTPRequest> findByPhoneNumber(String phoneNumber);

    void deleteByPhoneNumber(String phoneNumber);
}
