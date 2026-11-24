package com.cinema.cinema_backend.controller;

import com.cinema.cinema_backend.dto.request.CreateSeatRequest;
import com.cinema.cinema_backend.dto.request.UpdateSeatRequest;
import com.cinema.cinema_backend.dto.response.ApiResponse;
import com.cinema.cinema_backend.dto.response.SeatResponse;
import com.cinema.cinema_backend.entity.Room;
import com.cinema.cinema_backend.entity.Seat;
import com.cinema.cinema_backend.repository.RoomRepository;
import com.cinema.cinema_backend.repository.SeatRepository;
import jakarta.validation.Valid;
import org.hibernate.exception.ConstraintViolationException;
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
@RequestMapping("/api/admin/rooms/{roomId}/seats")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSeatController {

    private final RoomRepository roomRepository;
    private final SeatRepository seatRepository;

    public AdminSeatController(
            RoomRepository roomRepository,
            SeatRepository seatRepository
    ) {
        this.roomRepository = roomRepository;
        this.seatRepository = seatRepository;
    }

    @GetMapping
    public ApiResponse<List<SeatResponse>> getSeats(
            @PathVariable("roomId") Long roomId
    ) {
        if (!roomRepository.existsById(roomId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found.");
        }

        return new ApiResponse<>(seatRepository.findSeatSummariesByRoomId(roomId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SeatResponse> createSeat(
            @PathVariable("roomId") Long roomId,
            @Valid @RequestBody CreateSeatRequest request
    ) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Room not found."
                ));

        String rowLabel = request.rowLabel().strip();
        String seatType = request.seatType().strip();
        Seat seat = new Seat(room, rowLabel, request.seatNumber(), seatType);

        try {
            seatRepository.saveAndFlush(seat);
        } catch (DataIntegrityViolationException exception) {
            throw translateSeatWriteError(exception);
        }

        return new ApiResponse<>(new SeatResponse(
                seat.getId(),
                rowLabel,
                request.seatNumber(),
                seatType,
                seat.getStatus()
        ));
    }

    @PutMapping("/{seatId}")
    @Transactional
    public ApiResponse<SeatResponse> updateSeat(
            @PathVariable("roomId") Long roomId,
            @PathVariable("seatId") Long seatId,
            @Valid @RequestBody UpdateSeatRequest request
    ) {
        int updated;

        try {
            updated = seatRepository.updateSeatDetails(
                    roomId,
                    seatId,
                    request.rowLabel().strip(),
                    request.seatNumber(),
                    request.seatType().strip()
            );
        } catch (DataIntegrityViolationException exception) {
            throw translateSeatWriteError(exception);
        }

        if (updated == 0) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Seat not found in this room."
            );
        }

        return new ApiResponse<>(
                seatRepository.findSeatSummary(roomId, seatId).orElseThrow()
        );
    }

    @DeleteMapping("/{seatId}")
    public ResponseEntity<ProblemDetail> deleteSeat(
            @PathVariable("roomId") Long roomId,
            @PathVariable("seatId") Long seatId
    ) {
        int deleted;

        try {
            deleted = seatRepository.deleteSeatInRoom(roomId, seatId);
        } catch (DataIntegrityViolationException exception) {
            if (exception.getMostSpecificCause() instanceof SQLException sqlException
                    && "23503".equals(sqlException.getSQLState())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ProblemDetail.forStatusAndDetail(
                                HttpStatus.CONFLICT,
                                "This seat is in use and cannot be deleted."
                        ));
            }

            throw exception;
        }

        if (deleted == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ProblemDetail.forStatusAndDetail(
                            HttpStatus.NOT_FOUND,
                            "Seat not found in this room."
                    ));
        }

        return ResponseEntity.noContent().build();
    }

    private RuntimeException translateSeatWriteError(
            DataIntegrityViolationException exception
    ) {
        if (exception.getCause() instanceof ConstraintViolationException violation
                && "uk_seats_room_row_number".equals(violation.getConstraintName())) {
            return new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A seat with this row and number already exists in this room.",
                    exception
            );
        }

        return exception;
    }
}