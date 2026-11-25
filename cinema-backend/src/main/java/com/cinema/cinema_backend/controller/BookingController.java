package com.cinema.cinema_backend.controller;

import com.cinema.cinema_backend.dto.request.CreateBookingRequest;
import com.cinema.cinema_backend.dto.response.BookingResponse;
import com.cinema.cinema_backend.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/movies/{movieId:[0-9]+}/showtimes/{showtimeId:[0-9]+}/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @PreAuthorize("hasRole('MEMBER')")
    public BookingResponse create(
            @PathVariable("movieId") Long movieId,
            @PathVariable("showtimeId") Long showtimeId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateBookingRequest request
    ) {
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "A bearer access token is required.");
        }

        return bookingService.create(movieId, showtimeId, Long.valueOf(jwt.getSubject()), request.seatIds());
    }
}