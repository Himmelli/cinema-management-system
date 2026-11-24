package com.cinema.cinema_backend.controller;

import com.cinema.cinema_backend.service.MoviePosterStorage;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/movie-posters")
@PreAuthorize("hasRole('ADMIN')")
public class MoviePosterController {

    private final MoviePosterStorage posterStorage;

    public MoviePosterController(MoviePosterStorage posterStorage) {
        this.posterStorage = posterStorage;
    }

    @PreAuthorize("permitAll()")
    @GetMapping("/{fileName}")
    public ResponseEntity<Resource> getPoster(@PathVariable("fileName") String fileName) {
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .cacheControl(CacheControl.noStore())
                .body(posterStorage.load(fileName));
    }
}