package com.cinema.cinema_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record UpdateSeatRequest(
        @NotBlank(message = "Row label is required.")
        @Size(max = 255, message = "Row label must not exceed 255 characters.")
        String rowLabel,

        @NotNull(message = "Seat number is required.")
        @Positive(message = "Seat number must be positive.")
        Integer seatNumber,

        @NotBlank(message = "Seat type is required.")
        @Size(max = 255, message = "Seat type must not exceed 255 characters.")
        String seatType
) {
}