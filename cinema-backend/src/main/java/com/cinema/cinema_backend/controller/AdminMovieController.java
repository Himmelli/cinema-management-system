package com.cinema.cinema_backend.controller;

import com.cinema.cinema_backend.dto.request.MovieRequest;
import com.cinema.cinema_backend.dto.response.ApiResponse;
import com.cinema.cinema_backend.dto.response.MovieSummaryResponse;
import com.cinema.cinema_backend.service.MovieService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.cinema.cinema_backend.dto.response.MovieDetailResponse;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import com.cinema.cinema_backend.exception.MovieDeletionConflictException;
import org.springframework.web.bind.annotation.DeleteMapping;
import com.cinema.cinema_backend.exception.InvalidPosterException;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/movies")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMovieController {

    private final MovieService movieService;

    public AdminMovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    @GetMapping
    public ApiResponse<List<MovieSummaryResponse>> getMovies() {
        return new ApiResponse<>(movieService.getMovies());
    }

    @GetMapping("/{id}")
    public ApiResponse<MovieDetailResponse> getMovie(@PathVariable("id") Long id) {
        return new ApiResponse<>(movieService.getMovie(id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MovieSummaryResponse>> createMovie(
            @Valid @RequestBody MovieRequest request
    ) {
        MovieSummaryResponse movie = movieService.createMovie(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(movie));
    }

    @PutMapping("/{id}")
    public ApiResponse<MovieDetailResponse> updateMovie(
            @PathVariable("id") Long id,
            @Valid @RequestBody MovieRequest request
    ) {
        return new ApiResponse<>(movieService.updateMovie(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMovie(@PathVariable("id") Long id) {
        movieService.deleteMovie(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(MovieDeletionConflictException.class)
    public ProblemDetail handleMovieDeletionConflict(
            MovieDeletionConflictException exception
    ) {
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                exception.getMessage()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleInvalidMovie(MethodArgumentNotValidException exception) {
        FieldError fieldError = exception.getBindingResult().getFieldError();
        String detail = fieldError == null
                ? "Invalid movie request."
                : fieldError.getDefaultMessage();

        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
    }

    @PostMapping(path = "/{id}/poster", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<MovieDetailResponse> uploadPoster(
            @PathVariable("id") Long id,
            @RequestPart("file") MultipartFile file
    ) {
        return new ApiResponse<>(movieService.uploadPoster(id, file));
    }

    @ExceptionHandler(InvalidPosterException.class)
    public ProblemDetail handleInvalidPoster(InvalidPosterException exception) {
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                exception.getMessage()
        );
    }
}