package com.cinema.cinema_backend.service;

import com.cinema.cinema_backend.dto.response.GenreResponse;
import com.cinema.cinema_backend.entity.Genre;
import com.cinema.cinema_backend.exception.DuplicateGenreException;
import com.cinema.cinema_backend.exception.GenreInUseException;
import com.cinema.cinema_backend.exception.ResourceNotFoundException;
import com.cinema.cinema_backend.repository.GenreRepository;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GenreService {

    private static final String UNIQUE_NAME_INDEX = "uq_genres_normalized_name";
    private static final String UNIQUE_VIOLATION = "23505";
    private static final String FOREIGN_KEY_VIOLATION = "23503";

    private final GenreRepository genreRepository;

    public GenreService(GenreRepository genreRepository) {
        this.genreRepository = genreRepository;
    }

    @Transactional(readOnly = true)
    public List<GenreResponse> getGenres() {
        return genreRepository.findAll(Sort.by("name"))
                .stream()
                .map(GenreService::toResponse)
                .toList();
    }

    @Transactional
    public GenreResponse createGenre(String name) {
        return saveGenre(new Genre(name));
    }

    @Transactional
    public GenreResponse updateGenre(Long id, String name) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> genreNotFound(id));

        genre.setName(name);
        return saveGenre(genre);
    }

    @Transactional
    public void deleteGenre(Long id) {
        int deletedCount;

        try {
            deletedCount = genreRepository.deleteGenreById(id);
        } catch (DataIntegrityViolationException exception) {
            if (hasConstraintViolation(exception, FOREIGN_KEY_VIOLATION, null)) {
                throw new GenreInUseException(exception);
            }

            throw exception;
        }

        if (deletedCount == 0) {
            throw genreNotFound(id);
        }
    }

    private GenreResponse saveGenre(Genre genre) {
        try {
            return toResponse(genreRepository.saveAndFlush(genre));
        } catch (DataIntegrityViolationException exception) {
            if (hasConstraintViolation(exception, UNIQUE_VIOLATION, UNIQUE_NAME_INDEX)) {
                throw new DuplicateGenreException(exception);
            }

            throw exception;
        }
    }

    private static GenreResponse toResponse(Genre genre) {
        return new GenreResponse(genre.getId(), genre.getName());
    }

    private static ResourceNotFoundException genreNotFound(Long id) {
        return new ResourceNotFoundException("Genre with ID " + id + " was not found.");
    }

    private static boolean hasConstraintViolation(
            Throwable exception,
            String sqlState,
            String constraintName
    ) {
        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            if (cause instanceof ConstraintViolationException violation
                    && sqlState.equals(violation.getSQLState())
                    && (constraintName == null
                    || constraintName.equals(violation.getConstraintName()))) {
                return true;
            }
        }

        return false;
    }
}