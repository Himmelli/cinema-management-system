package com.cinema.cinema_backend.dto.response;

import java.time.LocalDateTime;

public record PublicShowtimeResponse(
        Long id,
        Long cinemaId,
        String cinemaName,
        String cinemaAddress,
        String cinemaCity,
        LocalDateTime startTime,
        String format
) {
}