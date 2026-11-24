package com.cinema.cinema_backend.service;

import com.cinema.cinema_backend.dto.request.MovieRequest;
import com.cinema.cinema_backend.dto.response.GenreResponse;
import com.cinema.cinema_backend.dto.response.MovieDetailResponse;
import com.cinema.cinema_backend.dto.response.MovieSummaryResponse;
import com.cinema.cinema_backend.entity.Genre;
import com.cinema.cinema_backend.entity.Movie;
import com.cinema.cinema_backend.exception.ResourceNotFoundException;
import com.cinema.cinema_backend.repository.GenreRepository;
import com.cinema.cinema_backend.repository.MovieRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cinema.cinema_backend.exception.MovieDeletionConflictException;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Service
public class MovieService {

    private final MovieRepository movieRepository;
    private final GenreRepository genreRepository;
    private final MoviePosterStorage posterStorage;

    public MovieService(
            MovieRepository movieRepository,
            GenreRepository genreRepository,
            MoviePosterStorage posterStorage
    ) {
        this.movieRepository = movieRepository;
        this.genreRepository = genreRepository;
        this.posterStorage = posterStorage;
    }

    @Transactional(readOnly = true)
    public List<MovieSummaryResponse> getMovies() {
        return movieRepository.findMovieSummaries();
    }

    @Transactional(readOnly = true)
    public MovieDetailResponse getMovie(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> movieNotFound(id));

        return toDetail(movie);
    }

    @Transactional
    public MovieSummaryResponse createMovie(MovieRequest request) {
        List<Genre> genres = findSelectedGenres(request.genreIds());

        Movie movie = new Movie(
                request.title(),
                request.description(),
                request.duration(),
                request.releaseDate(),
                genres
        );

        Movie saved = movieRepository.save(movie);

        return new MovieSummaryResponse(
                saved.getId(),
                saved.getTitle(),
                saved.getDuration(),
                saved.getReleaseDate(),
                saved.getStatus()
        );
    }

    @Transactional
    public MovieDetailResponse updateMovie(Long id, MovieRequest request) {
        Movie movie = movieRepository.findForUpdateById(id)
                .orElseThrow(() -> movieNotFound(id));

        List<Genre> genres = findSelectedGenres(request.genreIds());

        movie.updateDetails(
                request.title(),
                request.description(),
                request.duration(),
                request.releaseDate(),
                genres
        );

        return toDetail(movie);
    }

    @Transactional
    public MovieDetailResponse uploadPoster(Long id, MultipartFile file) {
        Movie movie = movieRepository.findForUpdateById(id)
                .orElseThrow(() -> movieNotFound(id));

        String oldPosterUrl = movie.getPosterUrl();
        String newPosterUrl = posterStorage.store(file);

        schedulePosterCleanup(newPosterUrl, oldPosterUrl);
        movie.setPosterUrl(newPosterUrl);

        return toDetail(movie);
    }

    private void schedulePosterCleanup(String newPosterUrl, String oldPosterUrl) {
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCompletion(int status) {
                        if (status == STATUS_COMMITTED) {
                            posterStorage.deleteIfManaged(oldPosterUrl);
                        } else if (status == STATUS_ROLLED_BACK) {
                            posterStorage.deleteIfManaged(newPosterUrl);
                        }
                    }
                }
        );
    }

    @Transactional
    public void deleteMovie(Long id) {
        Movie movie = movieRepository.findForUpdateById(id)
                .orElseThrow(() -> movieNotFound(id));

        if (!"DRAFT".equals(movie.getStatus())) {
            throw new MovieDeletionConflictException(
                    "Only draft movies can be deleted."
            );
        }

        try {
            movieRepository.delete(movie);
            movieRepository.flush();
            schedulePosterCleanup(null, movie.getPosterUrl());
        } catch (DataIntegrityViolationException exception) {
            if (isForeignKeyViolation(exception)) {
                throw new MovieDeletionConflictException(
                        "This movie is in use and cannot be deleted.",
                        exception
                );
            }

            throw exception;
        }
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

    private List<Genre> findSelectedGenres(Set<Long> ids) {
        List<Genre> genres = genreRepository.findAllByIdForMovie(ids);

        if (genres.size() != ids.size()) {
            throw new ResourceNotFoundException(
                    "One or more selected genres were not found."
            );
        }

        return genres;
    }

    private static MovieDetailResponse toDetail(Movie movie) {
        List<GenreResponse> genres = movie.getGenres()
                .stream()
                .sorted(Comparator.comparing(Genre::getName)
                        .thenComparing(Genre::getId))
                .map(genre -> new GenreResponse(genre.getId(), genre.getName()))
                .toList();

        return new MovieDetailResponse(
                movie.getId(),
                movie.getTitle(),
                movie.getDescription(),
                movie.getDuration(),
                movie.getReleaseDate(),
                movie.getPosterUrl(),
                movie.getTrailerUrl(),
                movie.getStatus(),
                genres
        );
    }

    private static ResourceNotFoundException movieNotFound(Long id) {
        return new ResourceNotFoundException("Movie with ID " + id + " was not found.");
    }
}