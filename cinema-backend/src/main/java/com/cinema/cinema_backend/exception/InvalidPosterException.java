package com.cinema.cinema_backend.exception;

public class InvalidPosterException extends RuntimeException {

    public InvalidPosterException(String message) {
        super(message);
    }

    public InvalidPosterException(String message, Throwable cause) {
        super(message, cause);
    }
}