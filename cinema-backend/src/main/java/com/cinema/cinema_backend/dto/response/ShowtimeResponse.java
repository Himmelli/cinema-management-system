package com.cinema.cinema_backend.dto.response;

import java.time.LocalDateTime;

public record ShowtimeResponse(
        Long id,
        String movieTitle,
        String cinemaName,
        String roomName,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String format,
        String status
) {
}