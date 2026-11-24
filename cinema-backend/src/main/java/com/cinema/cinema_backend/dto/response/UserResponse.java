package com.cinema.cinema_backend.dto.response;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        String role
) {
}