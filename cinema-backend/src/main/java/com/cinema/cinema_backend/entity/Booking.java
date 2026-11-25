package com.cinema.cinema_backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "showtime_id", nullable = false)
    private Showtime showtime;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "discount", nullable = false, precision = 14, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "expired_at", nullable = false)
    private LocalDateTime expiredAt;

    @Column(name = "booking_code", nullable = false, unique = true)
    private String bookingCode;

    @ElementCollection
    @CollectionTable(name = "booking_seats", joinColumns = @JoinColumn(name = "booking_id"))
    @MapKeyColumn(name = "seat_id", nullable = false)
    @Column(name = "price", nullable = false, precision = 14, scale = 2)
    private Map<Long, BigDecimal> seatPrices = new LinkedHashMap<>();

    protected Booking() {
    }

    public Booking(
            User user, Showtime showtime, LocalDateTime expiredAt,
            String bookingCode, Map<Long, BigDecimal> seatPrices
    ) {
        this.user = user;
        this.showtime = showtime;
        this.expiredAt = expiredAt;
        this.bookingCode = bookingCode;
        this.status = "PENDING";
        this.seatPrices.putAll(seatPrices);
        this.totalAmount = seatPrices.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public Long getId() {
        return id;
    }

    public String getBookingCode() {
        return bookingCode;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getExpiredAt() {
        return expiredAt;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public Map<Long, BigDecimal> getSeatPrices() {
        return Map.copyOf(seatPrices);
    }
}