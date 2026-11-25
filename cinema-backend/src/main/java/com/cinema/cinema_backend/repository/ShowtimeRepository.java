package com.cinema.cinema_backend.repository;

import com.cinema.cinema_backend.dto.response.PublicShowtimeResponse;
import com.cinema.cinema_backend.dto.response.ShowtimeResponse;
import com.cinema.cinema_backend.entity.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Lock;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

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

    @Query("""
            select new com.cinema.cinema_backend.dto.response.PublicShowtimeResponse(
                showtime.id,
                cinema.id,
                cinema.name,
                cinema.address,
                cinema.city,
                showtime.startTime,
                showtime.format
            )
            from Showtime showtime
            join showtime.movie movie
            join showtime.room room
            join room.cinema cinema
            where movie.id = :movieId
              and movie.status in ('NOW_SHOWING', 'COMING_SOON')
              and room.status = 'ACTIVE'
              and showtime.status = 'SCHEDULED'
              and showtime.startTime >= :fromTime
              and showtime.startTime < :toTime
            order by cinema.name asc, cinema.id asc, showtime.startTime asc, showtime.id asc
            """)
    List<PublicShowtimeResponse> findPublicByMovieAndTimeRange(
            @Param("movieId") Long movieId,
            @Param("fromTime") LocalDateTime fromTime,
            @Param("toTime") LocalDateTime toTime
    );

    @Query("""
        select room.id
        from Showtime showtime
        join showtime.movie movie
        join showtime.room room
        where showtime.id = :showtimeId
          and movie.id = :movieId
          and movie.status in ('NOW_SHOWING', 'COMING_SOON')
          and room.status = 'ACTIVE'
          and showtime.status = 'SCHEDULED'
          and showtime.startTime >= :now
        """)
    Optional<Long> findRoomIdForPublicShowtime(
            @Param("movieId") Long movieId,
            @Param("showtimeId") Long showtimeId,
            @Param("now") LocalDateTime now
    );

    boolean existsByRoom_IdAndStartTimeLessThanAndEndTimeGreaterThan(
            Long roomId,
            LocalDateTime latestStartExclusive,
            LocalDateTime earliestEndExclusive
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select showtime from Showtime showtime where showtime.id = :id")
    Optional<Showtime> findByIdForUpdate(@Param("id") Long id);

}