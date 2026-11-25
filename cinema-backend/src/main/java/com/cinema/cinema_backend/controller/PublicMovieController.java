package com.cinema.cinema_backend.controller;

import com.cinema.cinema_backend.dto.response.NowShowingMovieResponse;
import com.cinema.cinema_backend.dto.response.PublicMovieDetailResponse;
import com.cinema.cinema_backend.dto.response.PublicShowtimeResponse;
import com.cinema.cinema_backend.dto.response.SeatResponse;
import com.cinema.cinema_backend.repository.MovieRepository;
import com.cinema.cinema_backend.repository.SeatRepository;
import com.cinema.cinema_backend.repository.ShowtimeRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("/api/movies")
public class PublicMovieController {

    private static final ZoneId CINEMA_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final MovieRepository movieRepository;
    private final ShowtimeRepository showtimeRepository;
    private final SeatRepository seatRepository;

    public PublicMovieController(
            MovieRepository movieRepository,
            ShowtimeRepository showtimeRepository,
            SeatRepository seatRepository
    ) {
        this.movieRepository = movieRepository;
        this.showtimeRepository = showtimeRepository;
        this.seatRepository = seatRepository;
    }

    @GetMapping("/now-showing")
    public List<NowShowingMovieResponse> findNowShowingMovies() {
        return movieRepository.findNowShowingMovies();
    }

    @GetMapping("/{movieId:[0-9]+}")
    public ResponseEntity<PublicMovieDetailResponse> findMovieById(
            @PathVariable("movieId") Long movieId
    ) {
        return ResponseEntity.of(movieRepository.findPublicMovieById(movieId));
    }

    @GetMapping("/{movieId:[0-9]+}/showtimes")
    public List<PublicShowtimeResponse> findShowtimes(
            @PathVariable("movieId") Long movieId,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDateTime now = LocalDateTime.now(CINEMA_ZONE);
        LocalDate today = now.toLocalDate();

        if (date.isBefore(today)) {
            return List.of();
        }

        LocalDateTime fromTime = date.equals(today) ? now : date.atStartOfDay();
        return showtimeRepository.findPublicByMovieAndTimeRange(
                movieId, fromTime, date.plusDays(1).atStartOfDay()
        );
    }

    @GetMapping("/{movieId:[0-9]+}/showtimes/{showtimeId:[0-9]+}/seats")
    public ResponseEntity<List<SeatResponse>> findShowtimeSeats(
            @PathVariable("movieId") Long movieId,
            @PathVariable("showtimeId") Long showtimeId
    ) {
        return ResponseEntity.of(
                showtimeRepository.findRoomIdForPublicShowtime(
                        movieId, showtimeId, LocalDateTime.now(CINEMA_ZONE)
                ).map(seatRepository::findSeatSummariesByRoomId)
        );
    }
}