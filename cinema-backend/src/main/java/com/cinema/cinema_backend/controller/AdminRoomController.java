package com.cinema.cinema_backend.controller;

import com.cinema.cinema_backend.dto.request.CreateRoomRequest;
import com.cinema.cinema_backend.dto.request.UpdateRoomRequest;
import com.cinema.cinema_backend.dto.response.ApiResponse;
import com.cinema.cinema_backend.dto.response.RoomResponse;
import com.cinema.cinema_backend.entity.Cinema;
import com.cinema.cinema_backend.entity.Room;
import com.cinema.cinema_backend.repository.CinemaRepository;
import com.cinema.cinema_backend.repository.RoomRepository;
import jakarta.validation.Valid;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.sql.SQLException;
import java.util.List;

@RestController
@RequestMapping("/api/admin/rooms")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRoomController {

    private final RoomRepository roomRepository;
    private final CinemaRepository cinemaRepository;

    public AdminRoomController(
            RoomRepository roomRepository,
            CinemaRepository cinemaRepository
    ) {
        this.roomRepository = roomRepository;
        this.cinemaRepository = cinemaRepository;
    }

    @GetMapping
    public ApiResponse<List<RoomResponse>> getRooms() {
        return new ApiResponse<>(roomRepository.findRoomSummaries());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RoomResponse> createRoom(
            @Valid @RequestBody CreateRoomRequest request
    ) {
        Cinema cinema = cinemaRepository.findById(request.cinemaId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Cinema not found."
                ));

        Room room = roomRepository.save(new Room(
                cinema,
                request.name().strip(),
                request.roomType().strip()
        ));

        return new ApiResponse<>(new RoomResponse(
                room.getId(),
                room.getName(),
                request.cinemaId(),
                cinema.getName(),
                room.getRoomType(),
                room.getStatus()
        ));
    }

    @PutMapping("/{id}")
    @Transactional
    public ApiResponse<RoomResponse> updateRoom(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoomRequest request
    ) {
        int updated = roomRepository.updateRoomDetails(
                id,
                request.name().strip(),
                request.roomType().strip()
        );

        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found.");
        }

        RoomResponse room = roomRepository.findRoomSummaryById(id)
                .orElseThrow();

        return new ApiResponse<>(room);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ProblemDetail> deleteRoom(@PathVariable Long id) {
        int deleted;

        try {
            deleted = roomRepository.deleteRoomById(id);
        } catch (DataIntegrityViolationException exception) {
            if (exception.getMostSpecificCause() instanceof SQLException sqlException
                    && "23503".equals(sqlException.getSQLState())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ProblemDetail.forStatusAndDetail(
                                HttpStatus.CONFLICT,
                                "This room is in use and cannot be deleted."
                        ));
            }

            throw exception;
        }

        if (deleted == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ProblemDetail.forStatusAndDetail(
                            HttpStatus.NOT_FOUND,
                            "Room not found."
                    ));
        }

        return ResponseEntity.noContent().build();
    }
}