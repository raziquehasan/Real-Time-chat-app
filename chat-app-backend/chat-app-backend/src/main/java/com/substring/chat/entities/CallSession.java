package com.substring.chat.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "call_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallSession {

    @Id
    private String id;

    @Indexed
    private String initiatorId;

    @Indexed
    private List<String> participantIds;

    private CallType callType;

    private CallStatus status;

    private LocalDateTime startedAt;

    private LocalDateTime endedAt;

    private boolean groupCall;

    private String groupId; // Optional: if call is within a group context
}
