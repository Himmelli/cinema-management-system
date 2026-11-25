package com.cinema.cinema_backend.repository;

import com.cinema.cinema_backend.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    Optional<Booking> findFirstByUser_IdAndShowtime_IdAndStatusAndExpiredAtAfterOrderByIdDesc(
            Long userId, Long showtimeId, String status, LocalDateTime now
    );
}