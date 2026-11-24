package com.cinema.cinema_backend.controller;

import com.cinema.cinema_backend.dto.request.CinemaRequest;
import com.cinema.cinema_backend.dto.response.ApiResponse;
import com.cinema.cinema_backend.dto.response.CinemaResponse;
import com.cinema.cinema_backend.entity.Cinema;
import com.cinema.cinema_backend.exception.ResourceNotFoundException;
import com.cinema.cinema_backend.repository.CinemaRepository;
import jakarta.validation.Valid;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
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
@RequestMapping("/api/admin/cinemas")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCinemaController {

    private final CinemaRepository cinemaRepository;

    public AdminCinemaController(CinemaRepository cinemaRepository) {
        this.cinemaRepository = cinemaRepository;
    }

    @GetMapping
    public ApiResponse<List<CinemaResponse>> getCinemas() {
        return new ApiResponse<>(cinemaRepository.findCinemaSummaries());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CinemaResponse>> createCinema(
            @Valid @RequestBody CinemaRequest request
    ) {
        Cinema cinema = cinemaRepository.save(
                new Cinema(request.name(), request.address(), request.city())
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(toResponse(cinema.getId(), request)));
    }

    @PutMapping("/{id}")
    public ApiResponse<CinemaResponse> updateCinema(
            @PathVariable("id") Long id,
            @Valid @RequestBody CinemaRequest request
    ) {
        int updatedRows = cinemaRepository.updateCinemaDetails(
                id, request.name(), request.address(), request.city()
        );

        if (updatedRows == 0) {
            throw cinemaNotFound(id);
        }

        return new ApiResponse<>(toResponse(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCinema(@PathVariable("id") Long id) {
        int deletedRows;

        try {
            deletedRows = cinemaRepository.deleteCinemaById(id);
        } catch (DataIntegrityViolationException exception) {
            if (isForeignKeyViolation(exception)) {
                throw new CinemaInUseException(exception);
            }

            throw exception;
        }

        if (deletedRows == 0) {
            throw cinemaNotFound(id);
        }

        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(CinemaInUseException.class)
    public ProblemDetail handleCinemaInUse() {
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                "This cinema is in use and cannot be deleted."
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleInvalidCinema(
            MethodArgumentNotValidException exception
    ) {
        FieldError fieldError = exception.getBindingResult().getFieldError();
        String detail = fieldError == null
                ? "Invalid cinema request."
                : fieldError.getDefaultMessage();

        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
    }

    private static CinemaResponse toResponse(Long id, CinemaRequest request) {
        return new CinemaResponse(id, request.name(), request.address(), request.city());
    }

    private static ResourceNotFoundException cinemaNotFound(Long id) {
        return new ResourceNotFoundException(
                "Cinema with ID " + id + " was not found."
        );
    }

    private static boolean isForeignKeyViolation(Throwable exception) {
        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            if (cause instanceof ConstraintViolationException violation
                    && "23503".equals(violation.getSQLState())) {
                return true;
            }
        }

        return false;
    }

    private static class CinemaInUseException extends RuntimeException {

        CinemaInUseException(Throwable cause) {
            super(cause);
        }
    }
}