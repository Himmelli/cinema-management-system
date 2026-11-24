import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { apiHttp } from '../../api/http'
import './HomePage.css'
import './HomeHero.css'

type NowShowingMovie = {
  id: number
  title: string
  duration: number
  releaseDate: string | null
  posterUrl: string | null
}

type FeaturedDetails = {
  description: string | null
}

type HomeState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; movies: NowShowingMovie[] }

function MoviePoster({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className="home-poster">
      {url && !failed ? (
        <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span>Chưa có ảnh áp phích</span>
      )}
    </div>
  )
}

function FeaturedMovie({ movie }: { movie: NowShowingMovie }) {
  const [details, setDetails] = useState<FeaturedDetails | null>(null)
  const moviePath = `/movies/${movie.id}`

  useEffect(() => {
    const controller = new AbortController()

    async function loadDetails() {
      try {
        const { data } = await apiHttp.get<FeaturedDetails>(moviePath, {
          signal: controller.signal,
        })

        if (!controller.signal.aborted) setDetails(data)
      } catch {
        // Thông tin từ danh sách phim đủ để hiển thị hero.
      }
    }

    void loadDetails()
    return () => controller.abort()
  }, [moviePath])

  return (
    <section className="cinespot-featured" aria-labelledby="home-featured-title">
      <div className="cinespot-featured-content">
        <p className="cinespot-featured-badge">Phim nổi bật</p>
        <h1 id="home-featured-title">{movie.title}</h1>

        <p className="cinespot-featured-meta">{movie.duration} phút</p>

        {details?.description && (
          <p className="cinespot-featured-description">{details.description}</p>
        )}

        <div className="cinespot-featured-actions">
          <Link className="cinespot-featured-book" to={moviePath}>
            <svg
              aria-hidden="true"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V6z M15 6v2m0 3v2m0 3v2" />
            </svg>
            Đặt vé ngay
          </Link>
          <Link className="cinespot-featured-details" to={moviePath}>
            Xem chi tiết
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const [searchParams] = useSearchParams()
  const [state, setState] = useState<HomeState>({ status: 'loading' })
  const query = searchParams.get('q')?.trim() ?? ''

  useEffect(() => {
    const controller = new AbortController()

    async function loadMovies() {
      try {
        const { data } = await apiHttp.get<NowShowingMovie[]>('/movies/now-showing', {
          signal: controller.signal,
        })

        if (!controller.signal.aborted) setState({ status: 'success', movies: data })
      } catch {
        if (!controller.signal.aborted) setState({ status: 'error' })
      }
    }

    void loadMovies()
    return () => controller.abort()
  }, [])

  const movies = state.status === 'success' ? state.movies : []
  const featured = query ? undefined : movies[0]
  const visibleMovies = query
    ? movies.filter((movie) => movie.title.toLowerCase().includes(query.toLowerCase()))
    : movies

  return (
    <div className="cinespot-home">
      <div className={featured ? 'home-shell home-shell-template' : 'home-shell'}>
        {featured && <FeaturedMovie key={featured.id} movie={featured} />}

        <section className="home-now-showing">
          {featured ? (
            <h2>Phim đang chiếu</h2>
          ) : (
            <h1>{query ? 'Kết quả tìm kiếm' : 'Phim đang chiếu'}</h1>
          )}

          {query && (
            <p className="home-search-summary">
              Kết quả cho “{query}” &middot; <Link to="/">Xóa tìm kiếm</Link>
            </p>
          )}

          {state.status === 'loading' && (
            <p className="home-message" role="status">Đang tải danh sách phim&hellip;</p>
          )}

          {state.status === 'error' && (
            <p className="home-message" role="alert">
              Không tải được danh sách phim. Hãy tải lại trang để thử lại.
            </p>
          )}

          {state.status === 'success' && visibleMovies.length === 0 && (
            <p className="home-message">
              {query ? 'Không tìm thấy phim phù hợp.' : 'Hiện chưa có phim đang chiếu.'}
            </p>
          )}

          {visibleMovies.length > 0 && (
            <div className="home-movie-grid">
              {visibleMovies.map((movie) => (
                <article className="home-movie-card" key={movie.id}>
                  <Link className="home-movie-link" to={`/movies/${movie.id}`}>
                    <MoviePoster key={movie.posterUrl} url={movie.posterUrl} />
                    <h3>{movie.title}</h3>
                  </Link>
                  <p>{movie.duration} phút</p>
                  <Link
                    className="home-card-book"
                    to={`/movies/${movie.id}`}
                    aria-label={`Đặt vé xem phim ${movie.title}`}
                  >
                    Đặt vé ngay
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
