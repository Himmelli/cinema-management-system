package com.cinema.cinema_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CinemaRequest(
        @NotBlank(message = "Cinema name is required.")
        @Size(max = 255, message = "Cinema name must be at most 255 characters.")
        String name,

        @NotBlank(message = "Cinema address is required.")
        @Size(max = 255, message = "Cinema address must be at most 255 characters.")
        String address,

        @NotBlank(message = "City is required.")
        @Size(max = 255, message = "City must be at most 255 characters.")
        String city
) {
    public CinemaRequest {
        name = strip(name);
        address = strip(address);
        city = strip(city);
    }

    private static String strip(String value) {
        return value == null ? null : value.strip();
    }
}