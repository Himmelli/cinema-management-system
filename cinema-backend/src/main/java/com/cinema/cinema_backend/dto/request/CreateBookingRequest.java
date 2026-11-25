package com.cinema.cinema_backend.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record CreateBookingRequest(
        @NotEmpty(message = "At least one seat is required.")
        List<@NotNull @Positive Long> seatIds
) {
}