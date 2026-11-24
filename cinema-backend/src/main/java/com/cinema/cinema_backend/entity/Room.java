package com.cinema.cinema_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cinema_id", nullable = false)
    private Cinema cinema;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "room_type", nullable = false)
    private String roomType;

    @Column(name = "status", nullable = false)
    private String status;

    protected Room() {
    }

    public Room(Cinema cinema, String name, String roomType) {
        this.cinema = cinema;
        this.name = name;
        this.roomType = roomType;
        this.status = "ACTIVE";
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getRoomType() {
        return roomType;
    }

    public String getStatus() {
        return status;
    }
}