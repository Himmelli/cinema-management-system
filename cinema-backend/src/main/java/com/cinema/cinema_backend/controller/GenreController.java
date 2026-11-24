package com.cinema.cinema_backend.controller;

import com.cinema.cinema_backend.dto.request.GenreRequest;
import com.cinema.cinema_backend.dto.response.ApiResponse;
import com.cinema.cinema_backend.dto.response.GenreResponse;
import com.cinema.cinema_backend.exception.DuplicateGenreException;
import com.cinema.cinema_backend.exception.GenreInUseException;
import com.cinema.cinema_backend.service.GenreService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/genres")
public class GenreController {

    private final GenreService genreService;

    public GenreController(GenreService genreService) {
        this.genreService = genreService;
    }

    @GetMapping
    public ApiResponse<List<GenreResponse>> getGenres() {
        return new ApiResponse<>(genreService.getGenres());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<GenreResponse>> createGenre(
            @Valid @RequestBody GenreRequest request
    ) {
        GenreResponse genre = genreService.createGenre(request.name());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(genre));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<GenreResponse> updateGenre(
            @PathVariable("id") Long id,
            @Valid @RequestBody GenreRequest request
    ) {
        return new ApiResponse<>(genreService.updateGenre(id, request.name()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteGenre(@PathVariable("id") Long id) {
        genreService.deleteGenre(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(DuplicateGenreException.class)
    public ProblemDetail handleDuplicateGenre(DuplicateGenreException exception) {
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                exception.getMessage()
        );
    }

    @ExceptionHandler(GenreInUseException.class)
    public ProblemDetail handleGenreInUse(GenreInUseException exception) {
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                exception.getMessage()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleInvalidGenre(MethodArgumentNotValidException exception) {
        FieldError fieldError = exception.getBindingResult().getFieldError("name");
        String detail = fieldError == null
                ? "Invalid genre request."
                : fieldError.getDefaultMessage();

        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
    }
}