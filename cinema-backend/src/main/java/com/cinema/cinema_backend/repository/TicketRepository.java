package com.cinema.cinema_backend.repository;

import com.cinema.cinema_backend.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    boolean existsByShowtime_IdAndSeat_IdIn(Long showtimeId, Collection<Long> seatIds);
}