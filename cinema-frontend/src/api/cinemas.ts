import { getCsrfHeaders } from './auth'
import { apiHttp } from './http'

export type CinemaRequest = {
  name: string
  address: string
  city: string
}

export type Cinema = CinemaRequest & {
  id: number
}

type ApiResponse<T> = {
  data: T
}

export async function listCinemas(signal: AbortSignal): Promise<Cinema[]> {
  const response = await apiHttp.get<ApiResponse<Cinema[]>>('/admin/cinemas', {
    signal,
  })

  return response.data.data
}

export async function createCinema(cinema: CinemaRequest): Promise<Cinema> {
  const headers = await getCsrfHeaders()

  const response = await apiHttp.post<ApiResponse<Cinema>>(
    '/admin/cinemas',
    cinema,
    { headers },
  )

  return response.data.data
}

export async function updateCinema(
  id: number,
  cinema: CinemaRequest,
): Promise<Cinema> {
  const headers = await getCsrfHeaders()

  const response = await apiHttp.put<ApiResponse<Cinema>>(
    `/admin/cinemas/${id}`,
    cinema,
    { headers },
  )

  return response.data.data
}

export async function deleteCinema(id: number): Promise<void> {
  const headers = await getCsrfHeaders()

  await apiHttp.delete(`/admin/cinemas/${id}`, { headers })
}