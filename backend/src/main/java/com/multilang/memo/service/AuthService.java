package com.multilang.memo.service;

import com.multilang.memo.dto.AuthResponse;
import com.multilang.memo.entity.User;
import com.multilang.memo.exception.DuplicateResourceException;
import com.multilang.memo.repository.UserRepository;
import org.springframework.stereotype.Service;

import com.multilang.memo.exception.AuthenticationException;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository){
        this.userRepository=userRepository;
    }

    //authenticate :String -> User
    public User authenticate(String authHeader) {
        if(authHeader==null || !authHeader.startsWith("Bearer")){
            throw new AuthenticationException("Invalid authorization header");
        }
        String token=authHeader.substring(7);

        User user=userRepository.findByToken(token)
                .orElseThrow(()-> new AuthenticationException("Invalid token"));

        if (user.getExpiresAt().isBefore(LocalDateTime.now())){
            throw new AuthenticationException("Token expired");
        }
        return user;
    }
    public AuthResponse register(String rawUsername) {
        String username=rawUsername.trim();

        if (username.isEmpty()){
            throw new IllegalArgumentException("ユーザー名を入力してください");
        }
        if (username.length()<3){
            throw new IllegalArgumentException("ユーザー名は3文字以上必要です");

        }
        if (username.length()>50){
            throw new IllegalArgumentException("ユーザー名は50文字以下で入力してください");

        }
        Optional<User> existing=userRepository.findByUsername(username);

        if(existing.isPresent()){
            User user=existing.get();

            if (user.getExpiresAt().isAfter(LocalDateTime.now())){
                throw new DuplicateResourceException("このユーザー名は既に使用されています");
            }
            return reactivateUser(user);
        }
        return createNewUser(username);
    }

    private AuthResponse reactivateUser(User user){
        user.setToken(UUID.randomUUID().toString());
        user.setExpiresAt(LocalDateTime.now().plusDays(90));
        userRepository.save(user);
        return new AuthResponse(user.getUsername(), user.getToken());
    }

    private AuthResponse createNewUser(String username){
        User user=new User();
        user.setUsername(username);
        user.setToken(UUID.randomUUID().toString());
        user.setExpiresAt(LocalDateTime.now().plusDays(90));
        userRepository.save(user);
        return new AuthResponse(user.getUsername(),user.getToken());

    }

    public AuthResponse verifyToken(String token) {
        User user=userRepository.findByToken(token)
                .orElseThrow(()->new AuthenticationException("無効なトークンです"));

        if (user.getExpiresAt().isBefore(LocalDateTime.now())){
            throw new AuthenticationException("トークンの有効期限が切れています");
        }

        user.setExpiresAt(LocalDateTime.now().plusDays(90));
        userRepository.save(user);
        return new AuthResponse(user.getUsername(), user.getToken());
    }

    public void logout(String token){
        userRepository.findByToken(token)
                .ifPresent(user->{
                    user.setExpiresAt(LocalDateTime.now().minusDays(1));
                    userRepository.save(user);
                });
    }
    public void invalidateAllTokens(){
        userRepository.findAll().forEach(user->{
            user.setExpiresAt(LocalDateTime.now().minusDays(1));
            userRepository.save(user);
        });
    }
}

