package com.cinema.cinema_backend.repository;

import com.cinema.cinema_backend.dto.response.CinemaResponse;
import com.cinema.cinema_backend.entity.Cinema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface CinemaRepository extends JpaRepository<Cinema, Long> {

    @Query("""
            select new com.cinema.cinema_backend.dto.response.CinemaResponse(
                cinema.id,
                cinema.name,
                cinema.address,
                cinema.city
            )
            from Cinema cinema
            order by cinema.city asc, cinema.name asc, cinema.id asc
            """)
    List<CinemaResponse> findCinemaSummaries();

    @Modifying
    @Transactional
    @Query("""
            update Cinema cinema
            set cinema.name = :name,
                cinema.address = :address,
                cinema.city = :city
            where cinema.id = :id
            """)
    int updateCinemaDetails(
            @Param("id") Long id,
            @Param("name") String name,
            @Param("address") String address,
            @Param("city") String city
    );

    @Modifying
    @Transactional
    @Query("delete from Cinema cinema where cinema.id = :id")
    int deleteCinemaById(@Param("id") Long id);
}