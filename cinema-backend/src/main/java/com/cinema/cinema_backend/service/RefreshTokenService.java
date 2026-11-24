package com.cinema.cinema_backend.service;

import com.cinema.cinema_backend.entity.RefreshToken;
import com.cinema.cinema_backend.entity.User;
import com.cinema.cinema_backend.repository.RefreshTokenRepository;
import com.cinema.cinema_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private static final Duration REFRESH_TOKEN_TTL = Duration.ofDays(7);
    private static final int TOKEN_LENGTH = 43;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            UserRepository userRepository
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public String issueFor(User user) {
        return saveToken(
                user,
                UUID.randomUUID(),
                Instant.now().plus(REFRESH_TOKEN_TTL)
        );
    }

    @Transactional
    public Optional<RotatedRefreshToken> rotate(String rawToken) {
        if (rawToken == null || rawToken.length() != TOKEN_LENGTH) {
            return Optional.empty();
        }

        String tokenHash = hashToken(rawToken);

        Optional<User> owner = refreshTokenRepository.findOwnerIdByTokenHash(tokenHash)
                .flatMap(userRepository::findByIdForUpdate);

        if (owner.isEmpty()) {
            return Optional.empty();
        }

        // Read the token state after acquiring the account lock.
        RefreshToken current = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElse(null);

        Instant now = Instant.now();

        if (current == null || !current.getExpiresAt().isAfter(now)) {
            return Optional.empty();
        }

        if (current.isRevoked()) {
            refreshTokenRepository.revokeFamily(current.getFamilyId(), now);
            return Optional.empty();
        }

        current.revoke(now);

        User user = owner.get();
        String newToken = saveToken(user, current.getFamilyId(), current.getExpiresAt());

        return Optional.of(new RotatedRefreshToken(user, newToken));
    }

    @Transactional
    public void revokeSession(String rawToken) {
        if (rawToken == null || rawToken.length() != TOKEN_LENGTH) {
            return;
        }

        String tokenHash = hashToken(rawToken);

        Optional<User> owner = refreshTokenRepository.findOwnerIdByTokenHash(tokenHash)
                .flatMap(userRepository::findByIdForUpdate);

        if (owner.isEmpty()) {
            return;
        }

        Instant now = Instant.now();

        refreshTokenRepository.findByTokenHash(tokenHash)
                .filter(token -> token.getExpiresAt().isAfter(now))
                .ifPresent(token -> refreshTokenRepository.revokeFamily(
                        token.getFamilyId(),
                        now
                ));
    }

    private String saveToken(User user, UUID familyId, Instant expiresAt) {
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);

        String rawToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(tokenBytes);

        refreshTokenRepository.save(new RefreshToken(
                user,
                hashToken(rawToken),
                familyId,
                expiresAt
        ));

        return rawToken;
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] hash = sha256.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable.", exception);
        }
    }

    public record RotatedRefreshToken(User user, String refreshToken) {
    }
}