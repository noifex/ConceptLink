package com.multilang.memo.controller;

import com.multilang.memo.dto.AuthResponse;
import com.multilang.memo.dto.RegisterRequest;
import com.multilang.memo.dto.TokenRequest;
import com.multilang.memo.entity.User;
import com.multilang.memo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        String username = request.getUsername().trim();

        // Validation
        if (username.isEmpty() || username.length() < 3) {
            return ResponseEntity.badRequest().body("ユーザー名は3文字以上必要です");
        }

        if (username.length() > 50) {
            return ResponseEntity.badRequest().body("ユーザー名は50文字以下で入力してください");
        }

        // Check if username already exists
        User existingUser = userRepository.findByUsername(username).orElse(null);

        if (existingUser != null) {
            // User exists - check if token is expired
            if (existingUser.getExpiresAt().isAfter(LocalDateTime.now())) {
                // Token still valid - user already logged in
                return ResponseEntity.badRequest().body("このユーザー名は既に使用されています");
            }

            // Token expired - reactivate the account with new token
            existingUser.setToken(UUID.randomUUID().toString());
            existingUser.setExpiresAt(LocalDateTime.now().plusDays(365));
            userRepository.save(existingUser);

            return ResponseEntity.ok(new AuthResponse(existingUser.getUsername(), existingUser.getToken()));
        }

        // Create new user
        User user = new User();
        user.setUsername(username);
        user.setToken(UUID.randomUUID().toString());
        user.setExpiresAt(LocalDateTime.now().plusDays(365));

        userRepository.save(user);

        return ResponseEntity.ok(new AuthResponse(user.getUsername(), user.getToken()));
    }

    @PostMapping("/verify-token")
    public ResponseEntity<?> verifyToken(@RequestBody TokenRequest request) {
        User user = userRepository.findByToken(request.getToken())
            .orElse(null);

        if (user == null) {
            return ResponseEntity.status(401).body("無効なトークンです");
        }

        // Check if token expired
        if (user.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(401).body("トークンの有効期限が切れています");
        }

        // Extend token expiration (active user)
        user.setExpiresAt(LocalDateTime.now().plusDays(365));
        userRepository.save(user);

        return ResponseEntity.ok(new AuthResponse(user.getUsername(), user.getToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody TokenRequest request) {
        userRepository.findByToken(request.getToken())
            .ifPresent(user -> {
                // Expire the token immediately instead of deleting the user
                user.setExpiresAt(LocalDateTime.now().minusDays(1));
                userRepository.save(user);
            });

        return ResponseEntity.ok().build();
    }
}
