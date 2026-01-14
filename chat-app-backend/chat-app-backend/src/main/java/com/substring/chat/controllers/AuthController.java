package com.substring.chat.controllers;

import com.substring.chat.config.JwtUtil;
import com.substring.chat.entities.User;
import com.substring.chat.payload.AuthResponse;
import com.substring.chat.payload.LoginRequest;
import com.substring.chat.payload.RegisterRequest;
import com.substring.chat.payload.UserResponse;
import com.substring.chat.repositories.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationManager authenticationManager;

    /**
     * Register a new user
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest request) {
        try {
            // Check if email already exists
            if (userRepository.existsByEmail(request.getEmail())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Email already registered");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            // Create new user
            User user = new User();
            user.setName(request.getName());
            user.setEmail(request.getEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setCreatedAt(LocalDateTime.now());
            user.setLastSeen(LocalDateTime.now());
            user.setOnline(false);

            // Save user
            User savedUser = userRepository.save(user);

            // Generate JWT token
            String token = jwtUtil.generateToken(savedUser.getEmail());

            // Return response
            AuthResponse response = new AuthResponse(
                    token,
                    savedUser.getEmail(),
                    savedUser.getName(),
                    savedUser.getId());
            response.setMessage("User registered successfully");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Registration failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Login user
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@Valid @RequestBody LoginRequest request) {
        try {
            // Authenticate user
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()));

            // Find user
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Update online status
            user.setOnline(true);
            user.setLastSeen(LocalDateTime.now());
            userRepository.save(user);

            // Generate JWT token
            String token = jwtUtil.generateToken(user.getEmail());

            // Return response
            AuthResponse response = new AuthResponse(
                    token,
                    user.getEmail(),
                    user.getName(),
                    user.getId());
            response.setMessage("Login successful");

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Invalid email or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Login failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Get current authenticated user
     * GET /api/auth/me
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            // Get authenticated user from security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = ((UserDetails) authentication.getPrincipal()).getUsername();

            // Find user
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Create response
            UserResponse response = new UserResponse(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getCreatedAt(),
                    user.getLastSeen(),
                    user.isOnline(),
                    user.getAvatarUrl(),
                    user.getAbout(),
                    user.getPhone());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to get user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Logout user (update online status)
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = ((UserDetails) authentication.getPrincipal()).getUsername();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            user.setOnline(false);
            user.setLastSeen(LocalDateTime.now());
            userRepository.save(user);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Logout successful");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Logout failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
