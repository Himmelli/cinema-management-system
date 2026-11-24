package com.cinema.cinema_backend.repository;

import com.cinema.cinema_backend.dto.response.RoomResponse;
import com.cinema.cinema_backend.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    String ROOM_SUMMARY_QUERY = """
            select new com.cinema.cinema_backend.dto.response.RoomResponse(
                room.id,
                room.name,
                cinema.id,
                cinema.name,
                room.roomType,
                room.status
            )
            from Room room
            join room.cinema cinema
            """;

    @Query(ROOM_SUMMARY_QUERY + " order by cinema.name, room.name, room.id")
    List<RoomResponse> findRoomSummaries();

    @Query(ROOM_SUMMARY_QUERY + " where room.id = :id")
    Optional<RoomResponse> findRoomSummaryById(@Param("id") Long id);

    @Modifying
    @Query("""
            update Room room
            set room.name = :name,
                room.roomType = :roomType
            where room.id = :id
            """)
    int updateRoomDetails(
            @Param("id") Long id,
            @Param("name") String name,
            @Param("roomType") String roomType
    );

    @Modifying
    @Transactional
    @Query("delete from Room room where room.id = :id")
    int deleteRoomById(@Param("id") Long id);
}