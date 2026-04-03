package com.multilang.memo.controller;

import com.multilang.memo.dto.AuthResponse;
import com.multilang.memo.dto.RegisterRequest;
import com.multilang.memo.dto.TokenRequest;
import com.multilang.memo.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-token")
    public ResponseEntity<AuthResponse> verifyToken(@RequestBody TokenRequest request) {
        AuthResponse response = authService.verifyToken(request.getToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody TokenRequest request) {
        authService.logout(request.getToken());
        return ResponseEntity.ok().build();
    }

    // #6修正: 認証必須にする
    @PostMapping("/invalidate-all")
    public ResponseEntity<String> invalidateAllTokens(
            @RequestHeader("Authorization") String authHeader) {
        authService.authenticate(authHeader);  // 認証チェック追加
        authService.invalidateAllTokens();
        return ResponseEntity.ok("All tokens invalidated");
    }
}
