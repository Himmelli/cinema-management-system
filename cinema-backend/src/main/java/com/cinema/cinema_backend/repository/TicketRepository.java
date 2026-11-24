package com.cinema.cinema_backend.repository;

import com.cinema.cinema_backend.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
}