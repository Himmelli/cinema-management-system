package com.cinema.cinema_backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(
        name = "ticket_prices",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_ticket_prices_seat_format_day",
                columnNames = {"seat_type", "format", "day_type"}
        )
)
public class TicketPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seat_type", nullable = false)
    private String seatType;

    @Column(name = "format", nullable = false)
    private String format;

    @Column(name = "day_type", nullable = false)
    private String dayType;

    @Column(name = "price", nullable = false, precision = 14, scale = 2)
    private BigDecimal price;

    protected TicketPrice() {
    }
}