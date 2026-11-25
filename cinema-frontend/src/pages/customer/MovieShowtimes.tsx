import { useEffect, useState } from 'react'
import { apiHttp } from '../../api/http'
import MovieSeatMap from './MovieSeatMap'
import './MovieShowtimes.css'

type PublicShowtime = {
  id: number
  cinemaId: number
  cinemaName: string
  cinemaAddress: string
  cinemaCity: string
  startTime: string
  format: string
}

type ShowtimesState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; showtimes: PublicShowtime[] }

const cinemaDateFormat = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const weekdayFormat = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'UTC',
  weekday: 'short',
})

function getScheduleDays(now = new Date()) {
  const firstDay = cinemaDateFormat.format(now)

  return Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(`${firstDay}T00:00:00Z`)
    day.setUTCDate(day.getUTCDate() + offset)
    const value = day.toISOString().slice(0, 10)

    return {
      value,
      weekday: offset === 0 ? 'Hôm nay' : weekdayFormat.format(day),
      label: `${value.slice(8, 10)}/${value.slice(5, 7)}`,
    }
  })
}

function ShowtimesForDay({ movieId, date }: { movieId: number; date: string }) {
  const [state, setState] = useState<ShowtimesState>({ status: 'loading' })
  const [cinemaId, setCinemaId] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadShowtimes() {
      try {
        const { data } = await apiHttp.get<PublicShowtime[]>(`/movies/${movieId}/showtimes`, {
          params: { date },
          signal: controller.signal,
        })

        if (!controller.signal.aborted) setState({ status: 'success', showtimes: data })
      } catch {
        if (!controller.signal.aborted) setState({ status: 'error' })
      }
    }

    void loadShowtimes()
    return () => controller.abort()
  }, [movieId, date])

  if (state.status === 'loading') {
    return <p role="status">Đang tải lịch chiếu…</p>
  }

  if (state.status === 'error') {
    return <p role="alert">Không tải được lịch chiếu. Hãy tải lại trang để thử lại.</p>
  }

  if (state.showtimes.length === 0) {
    return <p role="status">Không có suất chiếu trong ngày này.</p>
  }

  const showtimesByCinema = new Map<number, PublicShowtime[]>()

  for (const showtime of state.showtimes) {
    const group = showtimesByCinema.get(showtime.cinemaId)

    if (group) {
      group.push(showtime)
    } else {
      showtimesByCinema.set(showtime.cinemaId, [showtime])
    }
  }

  const groups = Array.from(showtimesByCinema.values())
  const visibleGroups = cinemaId
    ? groups.filter(([first]) => String(first.cinemaId) === cinemaId)
    : groups
  const selected = state.showtimes.find((showtime) => showtime.id === selectedId)

  return (
    <>
      <label className="movie-showtimes-filter">
        Rạp
        <select
          value={cinemaId}
          onChange={(event) => {
            setCinemaId(event.target.value)
            setSelectedId(null)
          }}
        >
          <option value="">Tất cả rạp</option>
          {groups.map(([first]) => (
            <option key={first.cinemaId} value={first.cinemaId}>
              {first.cinemaName}
            </option>
          ))}
        </select>
      </label>

      {visibleGroups.map((showtimes) => {
        const [first] = showtimes

        return (
          <section className="movie-showtimes-cinema" key={first.cinemaId}>
            <h3>{first.cinemaName}</h3>
            <p>{first.cinemaAddress}, {first.cinemaCity}</p>

            <div className="movie-showtimes-slots">
              {showtimes.map((showtime) => (
                <button
                  key={showtime.id}
                  type="button"
                  aria-pressed={showtime.id === selectedId}
                  onClick={() => setSelectedId(showtime.id)}
                >
                  <time dateTime={showtime.startTime}>{showtime.startTime.slice(11, 16)}</time>
                  <span>{showtime.format}</span>
                </button>
              ))}
            </div>
          </section>
        )
      })}

      <p className="movie-showtimes-selection" role="status">
        {selected && `Đã chọn ${selected.startTime.slice(11, 16)} • ${selected.cinemaName} • ${selected.format}`}
      </p>

      {selected && <MovieSeatMap key={selected.id} movieId={movieId} showtimeId={selected.id} />}
    </>
  )
}

export default function MovieShowtimes({ movieId }: { movieId: number }) {
  const [days] = useState(getScheduleDays)
  const [date, setDate] = useState(days[0].value)

  return (
    <section className="movie-showtimes" aria-labelledby="movie-showtimes-title">
      <h2 id="movie-showtimes-title">Lịch chiếu</h2>

      <div className="movie-showtimes-days" role="group" aria-label="Ngày chiếu">
        {days.map((day) => (
          <button
            key={day.value}
            type="button"
            aria-pressed={date === day.value}
            onClick={() => setDate(day.value)}
          >
            <span>{day.weekday}</span>
            <time dateTime={day.value}>{day.label}</time>
          </button>
        ))}
      </div>

      <ShowtimesForDay key={date} movieId={movieId} date={date} />
    </section>
  )
}