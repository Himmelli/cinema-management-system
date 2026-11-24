package com.cinema.cinema_backend.exception;

public class MovieDeletionConflictException extends RuntimeException {

    public MovieDeletionConflictException(String message) {
        super(message);
    }

    public MovieDeletionConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}