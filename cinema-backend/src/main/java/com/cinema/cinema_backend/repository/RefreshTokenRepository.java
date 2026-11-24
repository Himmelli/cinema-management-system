package com.cinema.cinema_backend.repository;

import org.springframework.data.jpa.repository.Modifying;

import java.time.Instant;
import java.util.UUID;
import com.cinema.cinema_backend.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Query("""
            select token.user.id
            from RefreshToken token
            where token.tokenHash = :tokenHash
            """)
    Optional<Long> findOwnerIdByTokenHash(@Param("tokenHash") String tokenHash);

    @Modifying
    @Query("""
        update RefreshToken token
        set token.revokedAt = :revokedAt
        where token.familyId = :familyId
          and token.revokedAt is null
        """)
    void revokeFamily(
            @Param("familyId") UUID familyId,
            @Param("revokedAt") Instant revokedAt
    );
}