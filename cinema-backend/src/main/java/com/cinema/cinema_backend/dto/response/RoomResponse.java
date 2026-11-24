package com.cinema.cinema_backend.dto.response;

public record RoomResponse(
        Long id,
        String name,
        Long cinemaId,
        String cinemaName,
        String roomType,
        String status
) {
}