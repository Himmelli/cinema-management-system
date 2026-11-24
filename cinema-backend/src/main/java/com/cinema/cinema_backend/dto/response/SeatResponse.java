package com.cinema.cinema_backend.dto.response;

public record SeatResponse(
        Long id,
        String rowLabel,
        Integer seatNumber,
        String seatType,
        String status
) {
}