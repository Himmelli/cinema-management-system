import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { getCsrfHeaders } from '../../api/auth'
import { apiHttp } from '../../api/http'
import { listMovies } from '../../api/movies'
import type { MovieSummary } from '../../api/movies'
import { listRooms } from '../../api/rooms'
import type { Room } from '../../api/rooms'
import './ShowtimesPage.css'

type Showtime = {
  id: number
  movieTitle: string
  cinemaName: string
  roomName: string
  startTime: string
  endTime: string
  format: string
  status: string
}

type ShowtimesState =
  | { status: 'loading' }
  | { status: 'success'; showtimes: Showtime[] }
  | { status: 'error' }

type OptionsState =
  | { status: 'loading' }
  | { status: 'success'; movies: MovieSummary[]; rooms: Room[] }
  | { status: 'error' }

type SubmitState =
  | { status: 'idle' | 'saving' | 'success' }
  | { status: 'error'; message: string }

function displayDateTime(value: string) {
  return value.replace('T', ' ')
}

function getCreateError(error: unknown) {
  if (isAxiosError(error) && error.response?.status === 409) {
    return 'Could not schedule this showtime. Check the room, movie duration, and the 15-minute cleaning gap.'
  }

  return 'Could not create the showtime. Check your details and try again.'
}

export default function ShowtimesPage() {
  const [state, setState] = useState<ShowtimesState>({ status: 'loading' })
  const [options, setOptions] = useState<OptionsState>({ status: 'loading' })
  const [submit, setSubmit] = useState<SubmitState>({ status: 'idle' })
  const [listVersion, setListVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadShowtimes() {
      try {
        const { data } = await apiHttp.get<Showtime[]>('/admin/showtimes', {
          signal: controller.signal,
        })

        if (!controller.signal.aborted) {
          setState({ status: 'success', showtimes: data })
        }
      } catch {
        if (!controller.signal.aborted) {
          setState({ status: 'error' })
        }
      }
    }

    void loadShowtimes()
    return () => controller.abort()
  }, [listVersion])

  useEffect(() => {
    const controller = new AbortController()

    async function loadOptions() {
      try {
        const [movies, rooms] = await Promise.all([
          listMovies(controller.signal),
          listRooms(controller.signal),
        ])

        if (!controller.signal.aborted) {
          setOptions({
            status: 'success',
            movies,
            rooms: rooms.filter((room) => room.status === 'ACTIVE'),
          })
        }
      } catch {
        if (!controller.signal.aborted) {
          setOptions({ status: 'error' })
        }
      }
    }

    void loadOptions()
    return () => controller.abort()
  }, [])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submit.status === 'saving') return

    const form = event.currentTarget
    const values = new FormData(form)
    const format = String(values.get('format') ?? '').trim()

    if (!format) {
      setSubmit({ status: 'error', message: 'Format is required.' })
      return
    }

    const request = {
      movieId: Number(values.get('movieId')),
      roomId: Number(values.get('roomId')),
      startTime: String(values.get('startTime')),
      format,
    }

    setSubmit({ status: 'saving' })

    try {
      const headers = await getCsrfHeaders()
      await apiHttp.post('/admin/showtimes', request, { headers })
    } catch (error) {
      setSubmit({ status: 'error', message: getCreateError(error) })
      return
    }

    form.reset()
    setSubmit({ status: 'success' })
    setState({ status: 'loading' })
    setListVersion((version) => version + 1)
  }

  return (
    <section className="showtimes-page" aria-labelledby="showtimes-title">
      <h1 id="showtimes-title">Showtimes</h1>

      <form className="showtimes-form" onSubmit={handleCreate}>
        <h2>Add showtime</h2>

        {options.status === 'loading' && (
          <p role="status">Loading movies and rooms&hellip;</p>
        )}

        {options.status === 'error' && (
          <p className="showtimes-error" role="alert">
            Could not load movies and rooms. Refresh the page to try again.
          </p>
        )}

        {options.status === 'success' && (
          options.movies.length === 0 || options.rooms.length === 0 ? (
            <p>Add a movie and an active room before scheduling a showtime.</p>
          ) : (
            <fieldset
              className="showtimes-fields"
              disabled={submit.status === 'saving'}
            >
              <label>
                Movie
                <select name="movieId" defaultValue="" required>
                  <option value="" disabled>Select a movie</option>
                  {options.movies.map((movie) => (
                    <option key={movie.id} value={movie.id}>
                      {movie.title} ({movie.duration} min)
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Room
                <select name="roomId" defaultValue="" required>
                  <option value="" disabled>Select a room</option>
                  {options.rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.cinemaName} &mdash; {room.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Start time
                <input name="startTime" type="datetime-local" step={60} required />
              </label>

              <label>
                Format
                <input name="format" defaultValue="2D" maxLength={255} required />
              </label>

              <button type="submit">
                {submit.status === 'saving' ? 'Saving…' : 'Create showtime'}
              </button>
            </fieldset>
          )
        )}

        {submit.status === 'error' && (
          <p className="showtimes-error" role="alert">{submit.message}</p>
        )}

        {submit.status === 'success' && (
          <p role="status">Showtime created.</p>
        )}
      </form>

      {state.status === 'loading' && (
        <p className="showtimes-message" role="status">Loading showtimes&hellip;</p>
      )}

      {state.status === 'error' && (
        <p className="showtimes-message showtimes-error" role="alert">
          Could not load showtimes. Refresh the page to try again.
        </p>
      )}

      {state.status === 'success' && (
        state.showtimes.length === 0 ? (
          <p className="showtimes-message">No showtimes scheduled.</p>
        ) : (
          <div
            className="showtimes-table-container"
            role="region"
            aria-label="Showtime schedule"
            tabIndex={0}
          >
            <table className="showtimes-table">
              <thead>
                <tr>
                  <th scope="col">Movie</th>
                  <th scope="col">Cinema</th>
                  <th scope="col">Room</th>
                  <th scope="col">Start time</th>
                  <th scope="col">End time</th>
                  <th scope="col">Format</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {state.showtimes.map((showtime) => (
                  <tr key={showtime.id}>
                    <th scope="row">{showtime.movieTitle}</th>
                    <td>{showtime.cinemaName}</td>
                    <td>{showtime.roomName}</td>
                    <td className="showtimes-time">
                      <time dateTime={showtime.startTime}>
                        {displayDateTime(showtime.startTime)}
                      </time>
                    </td>
                    <td className="showtimes-time">
                      <time dateTime={showtime.endTime}>
                        {displayDateTime(showtime.endTime)}
                      </time>
                    </td>
                    <td>{showtime.format}</td>
                    <td>{showtime.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </section>
  )
}