package com.cinema.cinema_backend.dto.response;

import java.time.LocalDate;

public record PublicMovieDetailResponse(
        Long id,
        String title,
        String description,
        Integer duration,
        LocalDate releaseDate,
        String posterUrl,
        String trailerUrl,
        String status
) {
}