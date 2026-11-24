package com.cinema.cinema_backend.repository;

import com.cinema.cinema_backend.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {
}