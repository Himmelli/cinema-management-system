import { getCsrfHeaders } from './auth'
import { apiHttp } from './http'

export type Room = {
  id: number
  name: string
  cinemaId: number
  cinemaName: string
  roomType: string
  status: string
}

export type UpdateRoomRequest = {
  name: string
  roomType: string
}

export type CreateRoomRequest = UpdateRoomRequest & {
  cinemaId: number
}

export async function listRooms(signal?: AbortSignal): Promise<Room[]> {
  const response = await apiHttp.get<{ data: Room[] }>('/admin/rooms', {
    signal,
  })

  return response.data.data
}

export async function createRoom(request: CreateRoomRequest): Promise<Room> {
  const headers = await getCsrfHeaders()
  const response = await apiHttp.post<{ data: Room }>('/admin/rooms', request, {
    headers,
  })

  return response.data.data
}

export async function updateRoom(
  id: number,
  request: UpdateRoomRequest,
): Promise<Room> {
  const headers = await getCsrfHeaders()
  const response = await apiHttp.put<{ data: Room }>(`/admin/rooms/${id}`, request, {
    headers,
  })

  return response.data.data
}

export async function deleteRoom(id: number): Promise<void> {
  const headers = await getCsrfHeaders()

  await apiHttp.delete(`/admin/rooms/${id}`, { headers })
}