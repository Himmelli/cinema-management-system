package com.cinema.cinema_backend.dto.response;

public record CinemaResponse(
        Long id,
        String name,
        String address,
        String city
) {
}