package com.cinema.cinema_backend.controller;

import com.cinema.cinema_backend.dto.request.CreateShowtimeRequest;
import com.cinema.cinema_backend.dto.response.ShowtimeResponse;
import com.cinema.cinema_backend.service.ShowtimeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/showtimes")
@PreAuthorize("hasRole('ADMIN')")
public class AdminShowtimeController {

    private final ShowtimeService showtimeService;

    public AdminShowtimeController(ShowtimeService showtimeService) {
        this.showtimeService = showtimeService;
    }

    @GetMapping
    public List<ShowtimeResponse> findAll() {
        return showtimeService.findAllForAdmin();
    }

    @PostMapping
    public ResponseEntity<ShowtimeResponse> create(
            @Valid @RequestBody CreateShowtimeRequest request
    ) {
        ShowtimeResponse response = showtimeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}