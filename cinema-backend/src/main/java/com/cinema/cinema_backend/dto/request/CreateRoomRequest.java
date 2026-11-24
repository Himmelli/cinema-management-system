package com.cinema.cinema_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateRoomRequest(
        @NotNull(message = "Cinema ID is required.")
        @Positive(message = "Cinema ID must be positive.")
        Long cinemaId,

        @NotBlank(message = "Room name is required.")
        @Size(max = 255, message = "Room name must not exceed 255 characters.")
        String name,

        @NotBlank(message = "Room type is required.")
        @Size(max = 255, message = "Room type must not exceed 255 characters.")
        String roomType
) {
}