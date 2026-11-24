package com.cinema.cinema_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GenreRequest(
        @NotBlank(message = "Genre name is required.")
        @Size(max = 255, message = "Genre name must be at most 255 characters.")
        String name
) {
    public GenreRequest {
        if (name != null) {
            name = name.strip();
        }
    }
}