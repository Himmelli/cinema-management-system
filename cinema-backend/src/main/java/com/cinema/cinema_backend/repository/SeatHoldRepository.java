package com.cinema.cinema_backend.repository;

import com.cinema.cinema_backend.entity.SeatHold;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SeatHoldRepository extends JpaRepository<SeatHold, Long> {
}