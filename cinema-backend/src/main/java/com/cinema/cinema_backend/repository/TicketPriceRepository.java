package com.cinema.cinema_backend.repository;

import com.cinema.cinema_backend.entity.TicketPrice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketPriceRepository extends JpaRepository<TicketPrice, Long> {
}