package com.cinema.cinema_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateRoomRequest(
        @NotBlank(message = "Room name is required.")
        @Size(max = 255, message = "Room name must not exceed 255 characters.")
        String name,

        @NotBlank(message = "Room type is required.")
        @Size(max = 255, message = "Room type must not exceed 255 characters.")
        String roomType
) {
}