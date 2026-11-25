package com.cinema.cinema_backend.repository;

import com.cinema.cinema_backend.entity.SeatHold;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface SeatHoldRepository extends JpaRepository<SeatHold, Long> {

    List<SeatHold> findByShowtime_IdAndSeat_IdIn(Long showtimeId, Collection<Long> seatIds);
}