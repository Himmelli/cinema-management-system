import { getCsrfHeaders } from './auth'
import { apiHttp } from './http'

export type Seat = {
  id: number
  rowLabel: string
  seatNumber: number
  seatType: string
  status: string
}

export type SeatRequest = {
  rowLabel: string
  seatNumber: number
  seatType: string
}

export async function listSeats(
  roomId: number,
  signal?: AbortSignal,
): Promise<Seat[]> {
  const response = await apiHttp.get<{ data: Seat[] }>(
    `/admin/rooms/${roomId}/seats`,
    { signal },
  )

  return response.data.data
}

export async function createSeat(
  roomId: number,
  request: SeatRequest,
): Promise<Seat> {
  const headers = await getCsrfHeaders()
  const response = await apiHttp.post<{ data: Seat }>(
    `/admin/rooms/${roomId}/seats`,
    request,
    { headers },
  )

  return response.data.data
}

export async function updateSeat(
  roomId: number,
  seatId: number,
  request: SeatRequest,
): Promise<Seat> {
  const headers = await getCsrfHeaders()
  const response = await apiHttp.put<{ data: Seat }>(
    `/admin/rooms/${roomId}/seats/${seatId}`,
    request,
    { headers },
  )

  return response.data.data
}

export async function deleteSeat(roomId: number, seatId: number): Promise<void> {
  const headers = await getCsrfHeaders()

  await apiHttp.delete(`/admin/rooms/${roomId}/seats/${seatId}`, { headers })
}