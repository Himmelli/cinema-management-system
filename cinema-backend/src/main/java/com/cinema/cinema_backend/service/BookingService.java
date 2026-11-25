package com.cinema.cinema_backend.service;

import com.cinema.cinema_backend.dto.response.BookingResponse;
import com.cinema.cinema_backend.entity.Booking;
import com.cinema.cinema_backend.entity.Seat;
import com.cinema.cinema_backend.entity.SeatHold;
import com.cinema.cinema_backend.entity.Showtime;
import com.cinema.cinema_backend.repository.BookingRepository;
import com.cinema.cinema_backend.repository.SeatHoldRepository;
import com.cinema.cinema_backend.repository.SeatRepository;
import com.cinema.cinema_backend.repository.ShowtimeRepository;
import com.cinema.cinema_backend.repository.TicketRepository;
import com.cinema.cinema_backend.repository.TicketPriceRepository;
import com.cinema.cinema_backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class BookingService {

    private static final ZoneId CINEMA_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String PENDING = "PENDING";

    private final BookingRepository bookings;
    private final ShowtimeRepository showtimes;
    private final SeatRepository seats;
    private final SeatHoldRepository holds;
    private final TicketPriceRepository prices;
    private final TicketRepository tickets;
    private final UserRepository users;

    public BookingService(
            BookingRepository bookings, ShowtimeRepository showtimes, SeatRepository seats,
            SeatHoldRepository holds, TicketPriceRepository prices,
            TicketRepository tickets, UserRepository users
    ) {
        this.bookings = bookings;
        this.showtimes = showtimes;
        this.seats = seats;
        this.holds = holds;
        this.prices = prices;
        this.tickets = tickets;
        this.users = users;
    }

    @Transactional
    public BookingResponse create(Long movieId, Long showtimeId, Long userId, List<Long> requestedIds) {
        Set<Long> seatIds = new LinkedHashSet<>(requestedIds);
        var user = users.findById(userId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found."));

        // Share the same showtime lock with SeatHoldService.
        Showtime showtime = showtimes.findByIdForUpdate(showtimeId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Showtime is not available."));
        LocalDateTime now = LocalDateTime.now(CINEMA_ZONE);
        Long roomId = showtimes.findRoomIdForPublicShowtime(movieId, showtimeId, now).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Showtime is not available."));

        List<Seat> activeSeats = seats.findByRoom_IdAndIdInAndStatus(roomId, seatIds, "ACTIVE");
        if (activeSeats.size() != seatIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select active seats in this showtime's room.");
        }

        List<SeatHold> activeHolds = holds.findByShowtime_IdAndSeat_IdIn(showtimeId, seatIds);
        if (activeHolds.size() != seatIds.size() || activeHolds.stream().anyMatch(
                hold -> !hold.getUserId().equals(userId) || !hold.getExpiredAt().isAfter(now))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Hold all selected seats before booking.");
        }
        if (tickets.existsByShowtime_IdAndSeat_IdIn(showtimeId, seatIds)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "One or more seats are already booked.");
        }

        var existing = bookings.findFirstByUser_IdAndShowtime_IdAndStatusAndExpiredAtAfterOrderByIdDesc(
                userId, showtimeId, PENDING, now);

        if (existing.isPresent()) {
            Booking pending = existing.get();
            if (!pending.getSeatPrices().keySet().equals(seatIds)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "A pending booking already exists for this showtime.");
            }
            return toResponse(pending);
        }

        LocalDateTime deadline = activeHolds.stream()
                .map(SeatHold::getExpiredAt).min(Comparator.naturalOrder()).orElseThrow();

        Map<Long, BigDecimal> seatPrices = calculatePrices(showtime, activeSeats);
        if (!deadline.isAfter(LocalDateTime.now(CINEMA_ZONE))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The seat hold has expired.");
        }

        String bookingCode = UUID.randomUUID().toString();
        Booking booking = bookings.save(new Booking(user, showtime, deadline, bookingCode, seatPrices));
        return toResponse(booking);
    }

    private Map<Long, BigDecimal> calculatePrices(Showtime showtime, List<Seat> activeSeats) {
        String dayType = showtime.getStartTime().getDayOfWeek().getValue() >= 6 ? "WEEKEND" : "WEEKDAY";
        Map<String, BigDecimal> unitPrices = new LinkedHashMap<>();
        Map<Long, BigDecimal> seatPrices = new LinkedHashMap<>();

        for (Seat seat : activeSeats) {
            BigDecimal price = unitPrices.computeIfAbsent(seat.getSeatType(), type ->
                    prices.findPrice(type, showtime.getFormat(), dayType).orElseThrow(() ->
                            new ResponseStatusException(HttpStatus.CONFLICT, "Ticket price is not configured.")));
            seatPrices.put(seat.getId(), price);
        }

        return seatPrices;
    }

    private BookingResponse toResponse(Booking booking) {
        return new BookingResponse(
                booking.getId(), booking.getBookingCode(), booking.getStatus(), booking.getTotalAmount(),
                booking.getExpiredAt().atZone(CINEMA_ZONE).toInstant(), booking.getSeatPrices()
        );
    }
}