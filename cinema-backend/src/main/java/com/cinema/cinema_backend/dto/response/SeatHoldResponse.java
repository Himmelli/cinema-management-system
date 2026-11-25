package com.cinema.cinema_backend.dto.response;

import java.time.Instant;
import java.util.List;

public record SeatHoldResponse(Long showtimeId, List<Long> seatIds, Instant expiresAt) {
}