package com.cinema.cinema_backend.repository;

import com.cinema.cinema_backend.dto.response.SeatResponse;
import com.cinema.cinema_backend.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Collection;

public interface SeatRepository extends JpaRepository<Seat, Long> {

    String SEAT_SUMMARY_QUERY = """
            select new com.cinema.cinema_backend.dto.response.SeatResponse(
                seat.id,
                seat.rowLabel,
                seat.seatNumber,
                seat.seatType,
                seat.status
            )
            from Seat seat
            where seat.room.id = :roomId
            """;

    @Query(SEAT_SUMMARY_QUERY + " order by seat.rowLabel, seat.seatNumber")
    List<SeatResponse> findSeatSummariesByRoomId(@Param("roomId") Long roomId);

    @Query(SEAT_SUMMARY_QUERY + " and seat.id = :seatId")
    Optional<SeatResponse> findSeatSummary(
            @Param("roomId") Long roomId,
            @Param("seatId") Long seatId
    );

    @Modifying
    @Query("""
            update Seat seat
            set seat.rowLabel = :rowLabel,
                seat.seatNumber = :seatNumber,
                seat.seatType = :seatType
            where seat.id = :seatId
              and seat.room.id = :roomId
            """)
    int updateSeatDetails(
            @Param("roomId") Long roomId,
            @Param("seatId") Long seatId,
            @Param("rowLabel") String rowLabel,
            @Param("seatNumber") Integer seatNumber,
            @Param("seatType") String seatType
    );

    @Modifying
    @Transactional
    @Query("""
            delete from Seat seat
            where seat.id = :seatId
              and seat.room.id = :roomId
            """)
    int deleteSeatInRoom(
            @Param("roomId") Long roomId,
            @Param("seatId") Long seatId
    );

    List<Seat> findByRoom_IdAndIdInAndStatus(Long roomId, Collection<Long> seatIds, String status);
}