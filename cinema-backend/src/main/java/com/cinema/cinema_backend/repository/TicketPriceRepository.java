package com.cinema.cinema_backend.repository;

import com.cinema.cinema_backend.entity.TicketPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;

public interface TicketPriceRepository extends JpaRepository<TicketPrice, Long> {

    @Query("""
            select tp.price from TicketPrice tp
            where tp.seatType = :seatType and tp.format = :format and tp.dayType = :dayType
            """)
    Optional<BigDecimal> findPrice(
            @Param("seatType") String seatType,
            @Param("format") String format,
            @Param("dayType") String dayType
    );
}