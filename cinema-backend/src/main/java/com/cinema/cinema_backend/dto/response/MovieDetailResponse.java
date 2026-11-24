package com.cinema.cinema_backend.dto.response;

import java.time.LocalDate;
import java.util.List;

public record MovieDetailResponse(
        Long id,
        String title,
        String description,
        Integer duration,
        LocalDate releaseDate,
        String posterUrl,
        String trailerUrl,
        String status,
        List<GenreResponse> genres
) {
}