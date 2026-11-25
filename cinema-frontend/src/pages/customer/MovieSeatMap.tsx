import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router'
import { getCsrfHeaders } from '../../api/auth'
import { apiHttp } from '../../api/http'
import type { Seat } from '../../api/seats'
import './MovieSeatMap.css'
import MovieBookingAction from './MovieBookingAction'

type SeatMapState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; seats: Seat[] }

function getSecondsLeft(expiresAt: number) {
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
}

function formatCountdown(seconds: number) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
  const remainder = String(seconds % 60).padStart(2, '0')
  return `${minutes}:${remainder}`
}

function getHoldError(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  switch (status) {
    case 401:
      return 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.'
    case 403:
      return 'Không xác thực được yêu cầu giữ ghế. Hãy tải lại trang rồi thử lại.'
    case 404:
      return 'Suất chiếu này không còn mở giữ ghế.'
    case 409:
      return 'Có ghế trong lựa chọn đang được giữ hoặc đã bán. Hãy chọn ghế khác.'
    default:
      return 'Không thể giữ ghế. Hãy thử lại.'
  }
}

export default function MovieSeatMap({ movieId, showtimeId }: { movieId: number; showtimeId: number }) {
  const { accountRole } = useOutletContext<{ accountRole: string | null }>()
  const [state, setState] = useState<SeatMapState>({ status: 'loading' })
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const [holdError, setHoldError] = useState('')
  const hasActiveHold = accountRole === 'MEMBER' && expiresAt !== null && secondsLeft > 0

  useEffect(() => {
    const controller = new AbortController()

    async function loadSeats() {
      try {
        const { data } = await apiHttp.get<Seat[]>(`/movies/${movieId}/showtimes/${showtimeId}/seats`, {
          signal: controller.signal,
        })

        if (!controller.signal.aborted) setState({ status: 'success', seats: data })
      } catch {
        if (!controller.signal.aborted) setState({ status: 'error' })
      }
    }

    void loadSeats()
    return () => controller.abort()
  }, [movieId, showtimeId])

  useEffect(() => {
    if (expiresAt === null || !hasActiveHold) return

    const timer = window.setInterval(() => {
      setSecondsLeft(getSecondsLeft(expiresAt))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [expiresAt, hasActiveHold])

  const seats = state.status === 'success' ? state.seats : []
  const rows = new Map<string, Seat[]>()

  for (const seat of seats) {
    const row = rows.get(seat.rowLabel)

    if (row) {
      row.push(seat)
    } else {
      rows.set(seat.rowLabel, [seat])
    }
  }

  const seatCodes = seats
    .filter((seat) => selectedIds.includes(seat.id))
    .map((seat) => `${seat.rowLabel}${seat.seatNumber}`)

  function toggleSeat(id: number) {
    setHoldError('')
    setSelectedIds((ids) => ids.includes(id)
      ? ids.filter((selectedId) => selectedId !== id)
      : [...ids, id])
  }

  async function holdSeats() {
    if (accountRole !== 'MEMBER' || selectedIds.length === 0 || isHolding || hasActiveHold) return

    setIsHolding(true)
    setHoldError('')

    try {
      const headers = await getCsrfHeaders()
      const { data } = await apiHttp.post<{ expiresAt: string }>(
        `/movies/${movieId}/showtimes/${showtimeId}/holds`,
        { seatIds: selectedIds },
        { headers },
      )
      const deadline = Date.parse(data.expiresAt)
      if (!Number.isFinite(deadline)) throw new Error('Invalid seat hold expiry.')

      setExpiresAt(deadline)
      setSecondsLeft(getSecondsLeft(deadline))
    } catch (error) {
      setHoldError(getHoldError(error))
    } finally {
      setIsHolding(false)
    }
  }

  return (
    <section className="movie-seat-map" aria-labelledby="movie-seat-map-title">
      <h3 id="movie-seat-map-title">Chọn ghế</h3>

      {state.status === 'loading' && <p role="status">Đang tải sơ đồ ghế…</p>}

      {state.status === 'error' && (
        <p role="alert">Không tải được sơ đồ ghế. Hãy chọn lại suất hoặc tải lại trang.</p>
      )}

      {state.status === 'success' && seats.length === 0 && (
        <p role="status">Phòng này chưa có sơ đồ ghế.</p>
      )}

      {seats.length > 0 && (
        <>
          <p className="movie-seat-map-screen">Màn hình</p>

          <div className="movie-seat-map-scroll" role="region" aria-label="Sơ đồ ghế theo hàng" tabIndex={0}>
            <div className="movie-seat-map-rows">
              {Array.from(rows, ([label, row]) => (
                <div className="movie-seat-map-row" role="group" aria-label={`Hàng ${label}`} key={label}>
                  <span className="movie-seat-map-row-label" aria-hidden="true">{label}</span>

                  {row.map((seat) => {
                    const code = `${seat.rowLabel}${seat.seatNumber}`

                    return (
                      <button
                        key={seat.id}
                        className="movie-seat-map-seat"
                        type="button"
                        aria-label={`Ghế ${code}`}
                        aria-pressed={selectedIds.includes(seat.id)}
                        disabled={seat.status !== 'ACTIVE' || isHolding || hasActiveHold}
                        onClick={() => toggleSeat(seat.id)}
                      >
                        {code}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          <p className="movie-seat-map-summary" role="status">
            {seatCodes.length > 0 ? `Ghế đã chọn: ${seatCodes.join(', ')}` : 'Chưa chọn ghế.'}
          </p>

          {hasActiveHold ? (
            <>
              <p className="movie-seat-map-hold-status" role="status">Đã giữ ghế thành công.</p>
              <p className="movie-seat-map-note">
                Thời gian giữ còn <strong role="timer">{formatCountdown(secondsLeft)}</strong>
              </p>
              <MovieBookingAction movieId={movieId} showtimeId={showtimeId} seatIds={selectedIds} />
            </>
          ) : (
            <div className="movie-seat-map-actions">
              {expiresAt !== null && <p role="status">Đã hết thời gian giữ ghế.</p>}

              {accountRole === 'MEMBER' && (
                <button
                  className="movie-seat-map-hold-button"
                  type="button"
                  disabled={selectedIds.length === 0 || isHolding}
                  onClick={() => void holdSeats()}
                >
                  {isHolding ? 'Đang giữ ghế…' : 'Giữ ghế'}
                </button>
              )}

              {accountRole === null && <Link to="/login">Đăng nhập để giữ ghế</Link>}

              {accountRole !== null && accountRole !== 'MEMBER' && (
                <p className="movie-seat-map-note">Tài khoản MEMBER mới có thể giữ ghế.</p>
              )}
            </div>
          )}

          {holdError && <p className="movie-seat-map-error" role="alert">{holdError}</p>}
        </>
      )}
    </section>
  )
}