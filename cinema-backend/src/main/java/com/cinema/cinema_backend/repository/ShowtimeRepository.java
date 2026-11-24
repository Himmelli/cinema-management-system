package com.cinema.cinema_backend.repository;

import com.cinema.cinema_backend.dto.response.ShowtimeResponse;
import com.cinema.cinema_backend.entity.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {

    String ADMIN_SHOWTIME_PROJECTION = """
            select new com.cinema.cinema_backend.dto.response.ShowtimeResponse(
                showtime.id,
                movie.title,
                cinema.name,
                room.name,
                showtime.startTime,
                showtime.endTime,
                showtime.format,
                showtime.status
            )
            from Showtime showtime
            join showtime.movie movie
            join showtime.room room
            join room.cinema cinema
            """;

    @Query(ADMIN_SHOWTIME_PROJECTION + """
            order by showtime.startTime asc, showtime.id asc
            """)
    List<ShowtimeResponse> findAllForAdmin();

    @Query(ADMIN_SHOWTIME_PROJECTION + """
            where showtime.id = :id
            """)
    Optional<ShowtimeResponse> findForAdminById(@Param("id") Long id);

    boolean existsByRoom_IdAndStartTimeLessThanAndEndTimeGreaterThan(
            Long roomId,
            LocalDateTime latestStartExclusive,
            LocalDateTime earliestEndExclusive
    );
}