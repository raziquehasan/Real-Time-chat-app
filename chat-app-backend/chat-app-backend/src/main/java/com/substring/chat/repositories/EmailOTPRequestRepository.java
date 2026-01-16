package com.substring.chat.repositories;

import com.substring.chat.entities.EmailOTPRequest;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailOTPRequestRepository extends CrudRepository<EmailOTPRequest, String> {

    Optional<EmailOTPRequest> findByEmail(String email);

    void deleteByEmail(String email);
}
