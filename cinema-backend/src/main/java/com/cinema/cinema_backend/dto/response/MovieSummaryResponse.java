package com.cinema.cinema_backend.dto.response;

import java.time.LocalDate;

public record MovieSummaryResponse(
        Long id,
        String title,
        Integer duration,
        LocalDate releaseDate,
        String status
) {
}