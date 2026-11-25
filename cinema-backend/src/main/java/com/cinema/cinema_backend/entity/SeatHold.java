package com.cinema.cinema_backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "seat_holds",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_seat_holds_showtime_seat",
                columnNames = {"showtime_id", "seat_id"}
        )
)
public class SeatHold {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "showtime_id", nullable = false)
    private Showtime showtime;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seat_id", nullable = false)
    private Seat seat;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "expired_at", nullable = false)
    private LocalDateTime expiredAt;

    protected SeatHold() {
    }

    public SeatHold(Showtime showtime, Seat seat, User user, LocalDateTime expiredAt) {
        this.showtime = showtime;
        this.seat = seat;
        assignTo(user, expiredAt);
    }

    public void assignTo(User user, LocalDateTime expiredAt) {
        this.user = user;
        this.expiredAt = expiredAt;
    }

    public Long getSeatId() {
        return seat.getId();
    }

    public Long getUserId() {
        return user.getId();
    }

    public LocalDateTime getExpiredAt() {
        return expiredAt;
    }
}