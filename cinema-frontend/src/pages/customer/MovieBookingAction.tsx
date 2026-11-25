import { isAxiosError } from 'axios'
import { useState } from 'react'
import { getCsrfHeaders } from '../../api/auth'
import { apiHttp } from '../../api/http'

type Booking = {
  bookingCode: string
  status: string
  totalAmount: number
}

type BookingState =
  | { status: 'idle' | 'submitting' }
  | { status: 'error'; message: string }
  | { status: 'success'; booking: Booking }

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

function getBookingError(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  switch (status) {
    case 401:
      return 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.'
    case 403:
      return 'Không xác thực được yêu cầu tạo đơn. Hãy tải lại trang rồi thử lại.'
    case 404:
      return 'Suất chiếu này không còn mở đặt vé.'
    case 409:
      return 'Không thể tạo đơn. Hãy kiểm tra lượt giữ ghế và bảng giá của suất chiếu.'
    default:
      return 'Không thể tạo đơn lúc này. Hãy thử lại.'
  }
}

export default function MovieBookingAction({
  movieId,
  showtimeId,
  seatIds,
}: {
  movieId: number
  showtimeId: number
  seatIds: number[]
}) {
  const [state, setState] = useState<BookingState>({ status: 'idle' })

  async function createBooking() {
    if (state.status === 'submitting' || state.status === 'success') return

    setState({ status: 'submitting' })

    try {
      const headers = await getCsrfHeaders()
      const { data } = await apiHttp.post<Booking>(
        `/movies/${movieId}/showtimes/${showtimeId}/bookings`,
        { seatIds },
        { headers },
      )
      setState({ status: 'success', booking: data })
    } catch (error) {
      setState({ status: 'error', message: getBookingError(error) })
    }
  }

  if (state.status === 'success') {
    const { booking } = state

    return (
      <div className="movie-seat-map-booking" role="status">
        <strong>{booking.status === 'PENDING' ? 'Đơn đang chờ thanh toán' : booking.status}</strong>
        <p>Mã đơn: {booking.bookingCode}</p>
        <p>Tổng tiền: <strong>{vnd.format(booking.totalAmount)}</strong></p>
      </div>
    )
  }

  return (
    <>
      <div className="movie-seat-map-actions">
        <button
          className="movie-seat-map-hold-button"
          type="button"
          disabled={state.status === 'submitting'}
          onClick={() => void createBooking()}
        >
          {state.status === 'submitting' ? 'Đang tạo đơn…' : 'Tạo đơn'}
        </button>
      </div>

      {state.status === 'error' && <p className="movie-seat-map-error" role="alert">{state.message}</p>}
    </>
  )
}