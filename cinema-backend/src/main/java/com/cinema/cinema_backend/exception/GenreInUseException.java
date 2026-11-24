package com.cinema.cinema_backend.exception;

public class GenreInUseException extends RuntimeException {

    public GenreInUseException(Throwable cause) {
        super("This genre is in use and cannot be deleted.", cause);
    }
}