package com.cinema.cinema_backend.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

public record BookingResponse(
        Long bookingId, String bookingCode, String status, BigDecimal totalAmount,
        Instant expiresAt, Map<Long, BigDecimal> seatPrices
) {
}