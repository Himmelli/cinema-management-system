package com.cinema.cinema_backend.exception;

public class DuplicateGenreException extends RuntimeException {

    public DuplicateGenreException(Throwable cause) {
        super("A genre with this name already exists.", cause);
    }
}