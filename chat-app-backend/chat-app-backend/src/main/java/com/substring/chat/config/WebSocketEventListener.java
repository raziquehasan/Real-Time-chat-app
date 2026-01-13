package com.substring.chat.config;

import com.substring.chat.services.UserStatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

@Component
public class WebSocketEventListener {

    @Autowired
    private UserStatusService userStatusService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal userPrincipal = headerAccessor.getUser();

        if (userPrincipal != null) {
            String userId = getUserIdFromPrincipal(userPrincipal);
            if (userId != null) {
                userStatusService.setUserOnline(userId, true);
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal userPrincipal = headerAccessor.getUser();

        if (userPrincipal != null) {
            String userId = getUserIdFromPrincipal(userPrincipal);
            if (userId != null) {
                userStatusService.setUserOnline(userId, false);
            }
        }
    }

    private String getUserIdFromPrincipal(Principal principal) {
        // Assuming the name in principal is the user ID
        // This is usually set in the JwtAuthenticationFilter
        return principal.getName();
    }
}
