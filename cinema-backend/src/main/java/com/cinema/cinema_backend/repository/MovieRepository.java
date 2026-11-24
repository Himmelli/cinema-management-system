package com.cinema.cinema_backend.repository;

import com.cinema.cinema_backend.dto.response.MovieSummaryResponse;
import com.cinema.cinema_backend.dto.response.NowShowingMovieResponse;
import com.cinema.cinema_backend.dto.response.PublicMovieDetailResponse;
import com.cinema.cinema_backend.entity.Movie;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MovieRepository extends JpaRepository<Movie, Long> {

    @Query("""
            select new com.cinema.cinema_backend.dto.response.MovieSummaryResponse(
                movie.id,
                movie.title,
                movie.duration,
                movie.releaseDate,
                movie.status
            )
            from Movie movie
            order by movie.title asc, movie.id asc
            """)
    List<MovieSummaryResponse> findMovieSummaries();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select movie from Movie movie where movie.id = :id")
    Optional<Movie> findForUpdateById(@Param("id") Long id);

    @Query("""
            select new com.cinema.cinema_backend.dto.response.NowShowingMovieResponse(
                movie.id,
                movie.title,
                movie.duration,
                movie.releaseDate,
                movie.posterUrl
            )
            from Movie movie
            where movie.status = 'NOW_SHOWING'
            order by movie.title asc, movie.id asc
            """)
    List<NowShowingMovieResponse> findNowShowingMovies();

    @Query("""
            select new com.cinema.cinema_backend.dto.response.PublicMovieDetailResponse(
                movie.id,
                movie.title,
                movie.description,
                movie.duration,
                movie.releaseDate,
                movie.posterUrl,
                movie.trailerUrl,
                movie.status
            )
            from Movie movie
            where movie.id = :id
              and movie.status in ('NOW_SHOWING', 'COMING_SOON')
            """)
    Optional<PublicMovieDetailResponse> findPublicMovieById(@Param("id") Long id);
}