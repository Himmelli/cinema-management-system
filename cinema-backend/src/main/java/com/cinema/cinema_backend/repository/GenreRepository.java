package com.cinema.cinema_backend.repository;

import com.cinema.cinema_backend.entity.Genre;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface GenreRepository extends JpaRepository<Genre, Long> {

    @Modifying
    @Query(value = "DELETE FROM genres WHERE id = :id", nativeQuery = true)
    int deleteGenreById(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_READ)
    @Query("""
            select genre
            from Genre genre
            where genre.id in :ids
            order by genre.id
            """)
    List<Genre> findAllByIdForMovie(@Param("ids") Set<Long> ids);
}