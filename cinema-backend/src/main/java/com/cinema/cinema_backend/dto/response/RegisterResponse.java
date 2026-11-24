package com.cinema.cinema_backend.dto.response;

public record RegisterResponse(
        Long id,
        String fullName,
        String email,
        String role
) {
}