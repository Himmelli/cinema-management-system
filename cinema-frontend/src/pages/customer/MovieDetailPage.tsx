import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { apiHttp } from '../../api/http'
import './MovieDetailPage.css'

type MovieDetail = {
  id: number
  title: string
  description: string | null
  duration: number
  releaseDate: string | null
  posterUrl: string | null
  trailerUrl: string | null
  status: 'NOW_SHOWING' | 'COMING_SOON'
}

type DetailState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'success'; movie: MovieDetail }

function getTrailerLink(value: string | null) {
  if (!value) return null

  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

function formatReleaseDate(date: string) {
  return date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$3/$2/$1')
}

function MovieBreadcrumb({ title = 'Chi tiết phim' }: { title?: string }) {
  return (
    <nav className="movie-detail-breadcrumb" aria-label="Đường dẫn điều hướng">
      <Link className="movie-detail-back" to="/">Trang chủ</Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{title}</span>
    </nav>
  )
}

function MovieDetails({ movieId }: { movieId: string }) {
  const [state, setState] = useState<DetailState>({ status: 'loading' })
  const [posterFailed, setPosterFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadMovie() {
      try {
        const { data } = await apiHttp.get<MovieDetail>(`/movies/${movieId}`, {
          signal: controller.signal,
        })

        if (!controller.signal.aborted) {
          setState({ status: 'success', movie: data })
        }
      } catch (error) {
        if (controller.signal.aborted) return

        if (isAxiosError(error) && error.response?.status === 404) {
          setState({ status: 'not-found' })
        } else {
          setState({ status: 'error' })
        }
      }
    }

    void loadMovie()
    return () => controller.abort()
  }, [movieId])

  if (state.status !== 'success') {
    return (
      <>
        <MovieBreadcrumb />
        {state.status === 'loading' && (
          <p className="movie-detail-message" role="status">Đang tải thông tin phim…</p>
        )}
        {state.status === 'not-found' && (
          <h1 className="movie-detail-message">Không tìm thấy phim</h1>
        )}
        {state.status === 'error' && (
          <p className="movie-detail-message" role="alert">
            Không tải được thông tin phim. Hãy tải lại trang để thử lại.
          </p>
        )}
      </>
    )
  }

  const { movie } = state
  const trailerLink = getTrailerLink(movie.trailerUrl)

  return (
    <>
      <MovieBreadcrumb title={movie.title} />

      <article className="movie-detail-grid" aria-labelledby="movie-detail-title">
        <div className="movie-detail-poster">
          {movie.posterUrl && !posterFailed ? (
            <img src={movie.posterUrl} alt="" onError={() => setPosterFailed(true)} />
          ) : (
            <span>Chưa có ảnh áp phích</span>
          )}
        </div>

        <div className="movie-detail-info">
          <p className="movie-detail-status">
            {movie.status === 'COMING_SOON' ? 'Sắp chiếu' : 'Đang chiếu'}
          </p>
          <h1 id="movie-detail-title">{movie.title}</h1>
          <p className="movie-detail-meta">{movie.duration} phút</p>

          {movie.description && (
            <p className="movie-detail-description">{movie.description}</p>
          )}

          {movie.releaseDate && (
            <p className="movie-detail-release">
              Khởi chiếu <time dateTime={movie.releaseDate}>{formatReleaseDate(movie.releaseDate)}</time>
            </p>
          )}

          {trailerLink && (
            <a
              className="movie-detail-trailer"
              href={trailerLink}
              target="_blank"
              rel="noreferrer"
            >
              Xem trailer
            </a>
          )}
        </div>
      </article>
    </>
  )
}

export default function MovieDetailPage() {
  const { movieId } = useParams()

  return (
    <section className="movie-detail-page" aria-label="Chi tiết phim">
      <div className="movie-detail-shell">
        {movieId && /^[0-9]+$/.test(movieId) ? (
          <MovieDetails key={movieId} movieId={movieId} />
        ) : (
          <>
            <MovieBreadcrumb />
            <h1 className="movie-detail-message">Không tìm thấy phim</h1>
          </>
        )}
      </div>
    </section>
  )
}
