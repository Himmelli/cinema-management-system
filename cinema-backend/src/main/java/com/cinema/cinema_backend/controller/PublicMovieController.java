package com.cinema.cinema_backend.controller;

import com.cinema.cinema_backend.dto.response.NowShowingMovieResponse;
import com.cinema.cinema_backend.dto.response.PublicMovieDetailResponse;
import com.cinema.cinema_backend.repository.MovieRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/movies")
public class PublicMovieController {

    private final MovieRepository movieRepository;

    public PublicMovieController(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    @GetMapping("/now-showing")
    public List<NowShowingMovieResponse> findNowShowingMovies() {
        return movieRepository.findNowShowingMovies();
    }

    @GetMapping("/{movieId:[0-9]+}")
    public ResponseEntity<PublicMovieDetailResponse> findMovieById(
            @PathVariable("movieId") Long movieId
    ) {
        return ResponseEntity.of(movieRepository.findPublicMovieById(movieId));
    }
}