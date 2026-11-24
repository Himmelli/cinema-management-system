package com.cinema.cinema_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Set;

public record MovieRequest(
        @NotBlank(message = "Movie title is required.")
        @Size(max = 255, message = "Movie title must be at most 255 characters.")
        String title,

        @Size(max = 255, message = "Description must be at most 255 characters.")
        String description,

        @NotNull(message = "Duration is required.")
        @Positive(message = "Duration must be greater than zero.")
        Integer duration,

        LocalDate releaseDate,

        @NotEmpty(message = "Select at least one genre.")
        Set<
                @NotNull(message = "Genre ID is required.")
                @Positive(message = "Genre ID must be greater than zero.")
                        Long
                > genreIds
) {
    public MovieRequest {
        if (title != null) {
            title = title.strip();
        }
        if (description != null) {
            description = description.strip();
        }
    }
}