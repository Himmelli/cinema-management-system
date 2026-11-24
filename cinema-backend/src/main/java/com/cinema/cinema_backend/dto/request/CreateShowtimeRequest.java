package com.cinema.cinema_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public record CreateShowtimeRequest(
        @NotNull(message = "Movie ID is required.")
        @Positive(message = "Movie ID must be positive.")
        Long movieId,

        @NotNull(message = "Room ID is required.")
        @Positive(message = "Room ID must be positive.")
        Long roomId,

        @NotNull(message = "Start time is required.")
        LocalDateTime startTime,

        @NotBlank(message = "Format is required.")
        String format
) {
}