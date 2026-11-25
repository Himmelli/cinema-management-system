package com.cinema.cinema_backend.controller;

import com.cinema.cinema_backend.dto.request.CreateSeatHoldRequest;
import com.cinema.cinema_backend.dto.response.SeatHoldResponse;
import com.cinema.cinema_backend.service.SeatHoldService;
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
@RequestMapping("/api/movies/{movieId:[0-9]+}/showtimes/{showtimeId:[0-9]+}/holds")
public class SeatHoldController {

    private final SeatHoldService seatHoldService;

    public SeatHoldController(SeatHoldService seatHoldService) {
        this.seatHoldService = seatHoldService;
    }

    @PostMapping
    @PreAuthorize("hasRole('MEMBER')")
    public SeatHoldResponse hold(
            @PathVariable("movieId") Long movieId,
            @PathVariable("showtimeId") Long showtimeId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateSeatHoldRequest request
    ) {
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "A bearer access token is required.");
        }

        return seatHoldService.hold(movieId, showtimeId, Long.valueOf(jwt.getSubject()), request.seatIds());
    }
}