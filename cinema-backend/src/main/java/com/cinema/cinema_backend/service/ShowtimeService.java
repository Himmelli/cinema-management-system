package com.cinema.cinema_backend.service;

import com.cinema.cinema_backend.dto.request.CreateShowtimeRequest;
import com.cinema.cinema_backend.dto.response.ShowtimeResponse;
import com.cinema.cinema_backend.entity.Movie;
import com.cinema.cinema_backend.entity.Room;
import com.cinema.cinema_backend.entity.Showtime;
import com.cinema.cinema_backend.repository.MovieRepository;
import com.cinema.cinema_backend.repository.ShowtimeRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ShowtimeService {

    private static final int CLEANING_MINUTES = 15;

    private final ShowtimeRepository showtimeRepository;
    private final MovieRepository movieRepository;
    private final EntityManager entityManager;

    public ShowtimeService(
            ShowtimeRepository showtimeRepository,
            MovieRepository movieRepository,
            EntityManager entityManager
    ) {
        this.showtimeRepository = showtimeRepository;
        this.movieRepository = movieRepository;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public List<ShowtimeResponse> findAllForAdmin() {
        return showtimeRepository.findAllForAdmin();
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ShowtimeResponse create(CreateShowtimeRequest request) {
        Movie movie = movieRepository.findById(request.movieId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Movie not found."
                ));

        Integer duration = movie.getDuration();
        if (duration == null || duration <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Movie duration must be positive."
            );
        }

        String format = request.format().strip();
        if (format.length() > 255) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Format must be at most 255 characters."
            );
        }

        Room room = entityManager.find(
                Room.class, request.roomId(), LockModeType.PESSIMISTIC_WRITE
        );

        if (room == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found.");
        }

        if (!"ACTIVE".equals(room.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room is not active.");
        }

        LocalDateTime requestedStartTime = request.startTime();
        int nanos = requestedStartTime.getNano();
        LocalDateTime startTime = requestedStartTime.withNano(nanos - nanos % 1_000);
        LocalDateTime endTime = startTime.plusMinutes(duration);

        boolean hasConflict =
                showtimeRepository.existsByRoom_IdAndStartTimeLessThanAndEndTimeGreaterThan(
                        room.getId(),
                        endTime.plusMinutes(CLEANING_MINUTES),
                        startTime.minusMinutes(CLEANING_MINUTES)
                );

        if (hasConflict) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Showtime conflicts with an existing showtime in this room."
            );
        }

        Showtime saved = showtimeRepository.saveAndFlush(
                new Showtime(movie, room, startTime, endTime, format)
        );

        return showtimeRepository.findForAdminById(saved.getId())
                .orElseThrow(() -> new IllegalStateException(
                        "Saved showtime could not be loaded."
                ));
    }
}