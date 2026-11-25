package com.cinema.cinema_backend.service;

import com.cinema.cinema_backend.dto.response.SeatHoldResponse;
import com.cinema.cinema_backend.entity.Seat;
import com.cinema.cinema_backend.entity.SeatHold;
import com.cinema.cinema_backend.entity.Showtime;
import com.cinema.cinema_backend.entity.User;
import com.cinema.cinema_backend.repository.SeatHoldRepository;
import com.cinema.cinema_backend.repository.SeatRepository;
import com.cinema.cinema_backend.repository.ShowtimeRepository;
import com.cinema.cinema_backend.repository.TicketRepository;
import com.cinema.cinema_backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class SeatHoldService {

    private static final ZoneId CINEMA_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final long HOLD_MINUTES = 10;

    private final ShowtimeRepository showtimeRepository;
    private final SeatRepository seatRepository;
    private final SeatHoldRepository seatHoldRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public SeatHoldService(
            ShowtimeRepository showtimeRepository,
            SeatRepository seatRepository,
            SeatHoldRepository seatHoldRepository,
            TicketRepository ticketRepository,
            UserRepository userRepository
    ) {
        this.showtimeRepository = showtimeRepository;
        this.seatRepository = seatRepository;
        this.seatHoldRepository = seatHoldRepository;
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public SeatHoldResponse hold(Long movieId, Long showtimeId, Long userId, List<Long> requestedIds) {
        Set<Long> seatIds = new LinkedHashSet<>(requestedIds);
        User user = userRepository.findById(userId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found.")
        );

        // Requests for the same showtime must check and update seat holds in order.
        Showtime showtime = showtimeRepository.findByIdForUpdate(showtimeId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Showtime is not available.")
        );

        LocalDateTime currentTime = LocalDateTime.now(CINEMA_ZONE);
        int nanos = currentTime.getNano();
        LocalDateTime now = currentTime.withNano(nanos - nanos % 1_000);
        Long roomId = showtimeRepository.findRoomIdForPublicShowtime(movieId, showtimeId, now)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Showtime is not available."));

        List<Seat> seats = seatRepository.findByRoom_IdAndIdInAndStatus(roomId, seatIds, "ACTIVE");
        if (seats.size() != seatIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select active seats in this showtime's room.");
        }
        if (ticketRepository.existsByShowtime_IdAndSeat_IdIn(showtimeId, seatIds)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "One or more seats are already booked.");
        }

        Map<Long, SeatHold> holds = seatHoldRepository.findByShowtime_IdAndSeat_IdIn(showtimeId, seatIds)
                .stream().collect(Collectors.toMap(SeatHold::getSeatId, Function.identity()));

        LocalDateTime newExpiry = now.plusMinutes(HOLD_MINUTES);
        if (showtime.getStartTime().isBefore(newExpiry)) {
            newExpiry = showtime.getStartTime();
        }

        LocalDateTime firstExpiry = newExpiry;
        for (Seat seat : seats) {
            SeatHold current = holds.get(seat.getId());
            if (current == null) {
                seatHoldRepository.save(new SeatHold(showtime, seat, user, newExpiry));
            } else if (!current.getExpiredAt().isAfter(now)) {
                current.assignTo(user, newExpiry);
            } else if (!current.getUserId().equals(userId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "One or more seats are held by another user.");
            } else if (current.getExpiredAt().isBefore(firstExpiry)) {
                firstExpiry = current.getExpiredAt();
            }
        }

        return new SeatHoldResponse(showtimeId, List.copyOf(seatIds), firstExpiry.atZone(CINEMA_ZONE).toInstant());
    }
}